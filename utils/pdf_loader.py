from pypdf import PdfReader
import warnings

def load_pdf(file_path):
    # strict=False tolerates malformed PDFs
    reader = PdfReader(file_path, strict=False)
    documents = []

    for i, page in enumerate(reader.pages):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                text = page.extract_text()
            if text and text.strip():
                documents.append({"content": text, "page": i + 1})
        except Exception:
            # skip broken pages silently
            continue

    return documents
