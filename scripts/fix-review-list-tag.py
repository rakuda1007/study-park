from pathlib import Path

TAG = "div"
files = [
]

for rel in files:
    p = Path(rel)
    t = p.read_text(encoding="utf-8")
    correct = f'        <{TAG} id="reviewList" class="review-list"></{TAG}>'
    import re

    t2, n = re.subn(
        r'\s*<[^>]+id="reviewList"[^>]*>\s*</[^>]+>\s*',
        "\n" + correct + "\n",
        t,
        count=1,
    )
    if n:
        p.write_text(t2, encoding="utf-8")
        print("fixed", rel)
    else:
        print("skip", rel)
