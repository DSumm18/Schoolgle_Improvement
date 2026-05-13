from pathlib import Path
from math import cos, pi, sin
from shutil import copy2
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent
LOGO = ROOT / "html-templates" / "assets" / "schoolgle-logo-horizontal.png"

NAVY = "#0b1320"
TEXT = "#111827"
MUTED = "#667085"
SOFT = "#f8fafc"
LINE = "#e5e7eb"
# Decorative brand accent colours used by the logo/accent bar only.
# Product/module colours below are the factual source for product labels.
COLOURS = ["#6b7280", "#f59e0b", "#3b82f6", "#9f1239", "#f97316", "#a78bfa", "#06b6d4"]

# Customer-facing source of truth: PLANET_GROUPS in apps/platform/src/app/(dashboard)/layout.tsx
# These are the module groups shown in the Schoolgle sidebar.
PRODUCT_MODULES = [
    ("School Improvement", "#6b7280"),
    ("Governance", "#f59e0b"),
    ("Business Operations", "#3b82f6"),
    ("Compliance & Safeguarding", "#9f1239"),
    ("Communications", "#f97316"),
    ("Intelligence", "#a78bfa"),
    ("Teaching & Learning", "#06b6d4"),
]

MARK_DOT_COLOURS = ["#f59e0b", "#3b82f6", "#06b6d4", "#a78bfa", "#f97316", "#9f1239", "#6b7280"]


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_accent_line(draw, x, y, width, height=5, gap=4):
    segment = (width - gap * (len(COLOURS) - 1)) / len(COLOURS)
    current = x
    for colour in COLOURS:
        draw.rounded_rectangle((current, y, current + segment, y + height), radius=height // 2, fill=colour)
        current += segment + gap


def draw_logo_mark(draw, x, y, size, dot_scale=0.12):
    radius = size * dot_scale
    center_x = x + size / 2
    center_y = y + size / 2
    orbit_radius = size * 0.34
    start_angle = -pi / 2 + pi / len(MARK_DOT_COLOURS)
    for index, colour in enumerate(MARK_DOT_COLOURS):
        angle = start_angle + (2 * pi * index / len(MARK_DOT_COLOURS))
        dot_x = center_x + cos(angle) * orbit_radius
        dot_y = center_y + sin(angle) * orbit_radius
        draw.ellipse((dot_x - radius, dot_y - radius, dot_x + radius, dot_y + radius), fill=colour)


def draw_logo_lockup(draw, x, y, mark_size, word_size):
    draw_logo_mark(draw, x, y, mark_size)
    draw.text(
        (x + mark_size + mark_size * 0.24, y + mark_size * 0.2),
        "Schoolgle",
        fill=NAVY,
        font=font(word_size, True),
    )


def paste_logo(canvas, x, y, width):
    logo = Image.open(LOGO).convert("RGBA")
    ratio = width / logo.width
    resized = logo.resize((width, int(logo.height * ratio)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, (x, y))
    return resized.size


def make_logo_white_transparent():
    logo = Image.open(LOGO).convert("RGBA")
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha and red > 242 and green > 242 and blue > 242:
                pixels[x, y] = (255, 255, 255, 0)
    return logo


def paste_clean_logo(canvas, x, y, width):
    logo = make_logo_white_transparent()
    ratio = width / logo.width
    resized = logo.resize((width, int(logo.height * ratio)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, (x, y))
    return resized.size


def soft_orbs(canvas):
    overlay = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    orbs = [
        (1110, -80, 360, "#dbeafe", 150),
        (1280, 120, 280, "#ede9fe", 130),
        (930, 260, 220, "#cffafe", 120),
        (1450, 250, 180, "#ffedd5", 110),
    ]
    for x, y, size, colour, blur in orbs:
        draw.ellipse((x, y, x + size, y + size), fill=colour + "88")
    canvas.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(blur)))


def draw_safe_profile_zone(draw):
    draw.ellipse((68, 196, 292, 420), fill="#ffffff", outline="#e5e7eb", width=4)
    draw.text((180, 292), "Profile\nphoto", fill="#cbd5e1", font=font(20, True), anchor="mm", align="center")


def profile_banner():
    canvas = Image.new("RGBA", (1584, 396), "#f8fafc")
    draw = ImageDraw.Draw(canvas)
    soft_orbs(canvas)
    draw_safe_profile_zone(draw)
    draw_logo_lockup(draw, 470, 76, 70, 31)
    draw.text((470, 182), "Safe AI that gets school work done.", fill=NAVY, font=font(42, True))
    draw.text(
        (470, 238),
        "Less admin · Connected evidence · More time for people",
        fill=MUTED,
        font=font(24),
    )
    draw_accent_line(draw, 470, 306, 780, 5)
    draw.text((470, 338), "schoolgle.co.uk", fill="#3b82f6", font=font(22, True))
    canvas.convert("RGB").save(OUT / "linkedin-advertising-profile-banner.png", quality=95)


def company_banner():
    # LinkedIn's current Page cover recommendation is 4200x700.
    # The live page still displays this as a shallow crop, so keep content central/right.
    canvas = Image.new("RGBA", (4200, 700), "#ffffff")
    draw = ImageDraw.Draw(canvas)
    soft_orbs(canvas)
    draw_logo_lockup(draw, 970, 128, 162, 78)
    draw.text((1805, 168), "Safe AI that gets school work done.", fill=NAVY, font=font(92, True))
    draw.text((1805, 300), "Less admin · Connected evidence · More time for people", fill=MUTED, font=font(52))
    draw_accent_line(draw, 1805, 448, 1340, 12, 9)
    draw.text((1805, 522), "schoolgle.co.uk", fill="#3b82f6", font=font(48, True))
    canvas.convert("RGB").save(OUT / "linkedin-advertising-company-banner.png", quality=95)

def company_logo():
    canvas = Image.new("RGBA", (800, 800), "#ffffff")
    draw = ImageDraw.Draw(canvas)
    rounded_rect(draw, (32, 32, 768, 768), 120, "#ffffff", "#e5e7eb", 4)
    draw_logo_mark(draw, 188, 166, 424)
    canvas.convert("RGB").save(OUT / "linkedin-company-logo.png", quality=95)


def shared_template_logos():
    assets_dir = ROOT / "html-templates" / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    lockup = Image.new("RGBA", (1200, 360), (255, 255, 255, 0))
    draw = ImageDraw.Draw(lockup)
    draw_logo_lockup(draw, 28, 60, 220, 124)
    lockup.save(assets_dir / "schoolgle-logo-horizontal.png")

    mark = Image.new("RGBA", (800, 800), (255, 255, 255, 0))
    draw = ImageDraw.Draw(mark)
    draw_logo_mark(draw, 154, 154, 492)
    mark.save(assets_dir / "schoolgle-logo-mark.png")


def post_image():
    canvas = Image.new("RGBA", (1200, 627), "#f8fafc")
    draw = ImageDraw.Draw(canvas)
    soft_orbs(canvas)
    rounded_rect(draw, (70, 64, 1130, 563), 38, "#ffffff", "#e5e7eb", 2)
    draw_logo_lockup(draw, 126, 112, 82, 42)
    draw.text((126, 236), "Safe AI that gets school work done.", fill=NAVY, font=font(48, True))
    draw.text((126, 318), "Less admin. Connected evidence.\nMore time for people.", fill=TEXT, font=font(30), spacing=10)
    draw_accent_line(draw, 126, 466, 760, 6)
    draw.text((126, 506), "schoolgle.co.uk", fill="#3b82f6", font=font(26, True))
    canvas.convert("RGB").save(OUT / "linkedin-advertising-post-image.png", quality=95)


def publish_html_assets():
    html_assets = ROOT / "html-templates" / "assets" / "linkedin-advertising"
    html_assets.mkdir(parents=True, exist_ok=True)
    for filename in [
        "linkedin-company-logo.png",
        "linkedin-advertising-profile-banner.png",
        "linkedin-advertising-company-banner.png",
        "linkedin-advertising-post-image.png",
    ]:
        copy2(OUT / filename, html_assets / filename)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    profile_banner()
    company_banner()
    company_logo()
    shared_template_logos()
    post_image()
    publish_html_assets()
    print("Created LinkedIn advertising assets in", OUT)


if __name__ == "__main__":
    main()
