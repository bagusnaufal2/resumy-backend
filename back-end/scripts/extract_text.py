import json
import re
import sys
import zlib
import zipfile
from pathlib import Path
from xml.etree import ElementTree

for stream_name in ("stdout", "stderr"):
    stream = getattr(sys, stream_name, None)
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")


WORD_NAMESPACE = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
PDF_STREAM_PATTERN = re.compile(rb"stream\r?\n(.*?)\r?\nendstream", re.DOTALL)
PDF_LITERAL_PATTERN = re.compile(rb"\((?:\\.|[^\\()])*\)")
PDF_HEX_PATTERN = re.compile(rb"<([0-9A-Fa-f\s]+)>")
PRINTABLE_RUN_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9\s,./:+#()&@_-]{2,}")


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def decode_pdf_literal(token: bytes) -> str:
    inner = token[1:-1]
    output = []
    index = 0

    while index < len(inner):
        byte = inner[index]

        if byte != 92:
            output.append(chr(byte))
            index += 1
            continue

        index += 1
        if index >= len(inner):
            break

        escaped = inner[index]

        simple_map = {
            ord("n"): "\n",
            ord("r"): "\r",
            ord("t"): "\t",
            ord("b"): "\b",
            ord("f"): "\f",
            ord("("): "(",
            ord(")"): ")",
            ord("\\"): "\\",
        }

        if escaped in simple_map:
            output.append(simple_map[escaped])
            index += 1
            continue

        if 48 <= escaped <= 55:
            octal_digits = [escaped]
            index += 1

            for _ in range(2):
                if index < len(inner) and 48 <= inner[index] <= 55:
                    octal_digits.append(inner[index])
                    index += 1
                else:
                    break

            output.append(chr(int(bytes(octal_digits), 8)))
            continue

        output.append(chr(escaped))
        index += 1

    return clean_text("".join(output))


def decode_pdf_hex(token: bytes) -> str:
    try:
        hex_string = re.sub(rb"\s+", b"", token)
        if len(hex_string) % 2 == 1:
            hex_string += b"0"
        return clean_text(bytes.fromhex(hex_string.decode("ascii")).decode("latin-1", "ignore"))
    except Exception:
        return ""


def extract_text_from_pdf_content(content: bytes) -> str:
    text_blocks = []
    seen = set()

    for token in PDF_LITERAL_PATTERN.findall(content):
        decoded = decode_pdf_literal(token)
        if decoded and decoded not in seen:
            text_blocks.append(decoded)
            seen.add(decoded)

    for token in PDF_HEX_PATTERN.findall(content):
        decoded = decode_pdf_hex(token)
        if decoded and decoded not in seen:
            text_blocks.append(decoded)
            seen.add(decoded)

    return clean_text(" ".join(text_blocks))


def extract_pdf_text(path: Path) -> tuple[str, list[str]]:
    raw = path.read_bytes()
    warnings = []
    extracted_sections = []

    for match in PDF_STREAM_PATTERN.finditer(raw):
        stream_data = match.group(1)
        header = raw[max(0, match.start() - 250): match.start()]

        candidates = [stream_data]
        if b"/FlateDecode" in header:
            try:
                candidates.insert(0, zlib.decompress(stream_data))
            except zlib.error:
                warnings.append("Sebagian stream PDF terkompresi dan tidak bisa didekompresi penuh.")

        for candidate in candidates:
            section = extract_text_from_pdf_content(candidate)
            if section:
                extracted_sections.append(section)

    if extracted_sections:
        return clean_text(" ".join(extracted_sections)), warnings

    fallback = extract_printable_text(raw)
    if fallback:
        warnings.append("PDF diproses dengan fallback parser sehingga hasil teks bisa kurang rapi.")
        return fallback, warnings

    raise ValueError("PDF text could not be extracted.")


def extract_docx_text(path: Path) -> tuple[str, list[str]]:
    paragraphs = []

    with zipfile.ZipFile(path) as archive:
        xml_members = [
            member
            for member in archive.namelist()
            if member.startswith("word/")
            and member.endswith(".xml")
            and (
                member == "word/document.xml"
                or member.startswith("word/header")
                or member.startswith("word/footer")
            )
        ]

        for member in sorted(xml_members):
            root = ElementTree.fromstring(archive.read(member))

            for paragraph in root.iter(f"{WORD_NAMESPACE}p"):
                pieces = []

                for node in paragraph.iter():
                    if node.tag == f"{WORD_NAMESPACE}t" and node.text:
                        pieces.append(node.text)
                    elif node.tag == f"{WORD_NAMESPACE}tab":
                        pieces.append("\t")
                    elif node.tag in {f"{WORD_NAMESPACE}br", f"{WORD_NAMESPACE}cr"}:
                        pieces.append("\n")

                joined = clean_text("".join(pieces))
                if joined:
                    paragraphs.append(joined)

    if not paragraphs:
        raise ValueError("DOCX text could not be extracted.")

    return "\n".join(paragraphs), []


def extract_printable_text(raw: bytes) -> str:
    candidates = []

    for decoded in (
        raw.decode("latin-1", "ignore"),
        raw.decode("utf-16le", "ignore"),
    ):
        candidates.extend(match.group().strip() for match in PRINTABLE_RUN_PATTERN.finditer(decoded))

    unique_candidates = []
    seen = set()
    for item in candidates:
        if item not in seen:
            seen.add(item)
            unique_candidates.append(item)

    return clean_text(" ".join(unique_candidates))


def extract_doc_text(path: Path) -> tuple[str, list[str]]:
    extracted = extract_printable_text(path.read_bytes())
    if not extracted:
        raise ValueError("DOC text could not be extracted.")
    return extracted, ["Format .doc diproses dengan fallback parser, jadi hasil bisa kurang akurat."]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: extract_text.py <file_path>", file=sys.stderr)
        return 1

    file_path = Path(sys.argv[1])
    extension = file_path.suffix.lower()

    try:
        if extension == ".docx":
            text, warnings = extract_docx_text(file_path)
            method = "docx-xml"
        elif extension == ".pdf":
            text, warnings = extract_pdf_text(file_path)
            method = "pdf-stream"
        elif extension == ".doc":
            text, warnings = extract_doc_text(file_path)
            method = "doc-fallback"
        else:
            text = extract_printable_text(file_path.read_bytes())
            warnings = ["Format file tidak dikenal, memakai fallback text extractor."]
            method = "generic-fallback"

        if not clean_text(text):
            raise ValueError("No readable text found in the uploaded file.")

        print(
            json.dumps(
                {
                    "text": text,
                    "method": method,
                    "warnings": warnings,
                },
                ensure_ascii=True,
            ),
        )
        return 0
    except Exception as error:
        print(str(error).encode("ascii", "backslashreplace").decode("ascii"), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
