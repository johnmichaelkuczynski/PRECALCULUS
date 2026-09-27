from pathlib import Path
import fitz

source = Path("attached_assets/precalculus-course_1790451796754.pdf")
output = Path(".agents/outputs/precalculus-pages")
output.mkdir(parents=True, exist_ok=True)
document = fitz.open(source)
print(f"Pages: {len(document)}")
for page_number in (0, 5, 10, 15, 21, 22, 23):
    page = document[page_number]
    target = output / f"page-{page_number + 1:02}.png"
    page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2)).save(target)
    print(f"{page_number + 1}: {target} ({len(page.get_images())} embedded images)")