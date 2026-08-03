---
name: cloudinary
description: Cloudinary API for image/video management. Use when user mentions "Cloudinary",
  "upload image", "transform image", or media assets.
---

## Troubleshooting

If requests fail, run `zero doctor check-connector --env-name CLOUDINARY_TOKEN` or `zero doctor check-connector --url https://api.cloudinary.com/v1_1/your-cloud-name/image/upload --method POST`

## How to Use

### Method 1: Unsigned Upload (Simpler)

First, create an unsigned upload preset in Cloudinary Console:
Settings > Upload > Upload presets > Add upload preset > Signing Mode: Unsigned

Before use, configure the preset with at least:
- `allowed_formats` (restrict MIME/extensions)
- `max_file_size` (bytes)
- `disallow_public_id` (true)

Source: [Cloudinary upload presets — secure unsigned preset](https://cloudinary.com/documentation/upload_presets).

Prefer **signed uploads** (Method 2) for authenticated or sensitive workflows. Use unsigned only for intentionally public client uploads behind a hardened preset.

```bash
curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload" -F "file=@/path/to/image.png" -F "upload_preset=your_preset_name"
```

### Method 2: Signed Upload

**Server-only:** Generate signatures on a trusted backend. Never expose `CLOUDINARY_API_SECRET` in browser or native-client code. Source: [Cloudinary image upload API — authentication](https://cloudinary.com/documentation/image_upload_api_reference).

Generate signature and upload:

```bash
# Generate timestamp
TIMESTAMP=$(date +%s)

# Generate signature (alphabetical order of params)
SIGNATURE=$(echo -n "timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

# Upload
curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload" -F "file=@/path/to/image.png" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

### Upload from URL

```bash
TIMESTAMP=$(date +%s)
SIGNATURE=$(echo -n "timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload" -F "file=https://example.com/image.png" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

### Upload Video

```bash
TIMESTAMP=$(date +%s)
SIGNATURE=$(echo -n "timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/video/upload" -F "file=@/path/to/video.mp4" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

### Upload Video with Custom Public ID

```bash
TIMESTAMP=$(date +%s)
PUBLIC_ID="my-videos/clip1"
SIGNATURE=$(echo -n "public_id=$PUBLIC_ID&timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/video/upload" -F "file=@/path/to/video.mp4" -F "public_id=$PUBLIC_ID" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

### Upload Video from URL

```bash
TIMESTAMP=$(date +%s)
PUBLIC_ID="my-videos/clip1"
SIGNATURE=$(echo -n "public_id=$PUBLIC_ID&timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/video/upload" -F "file=https://example.com/video.mp4" -F "public_id=$PUBLIC_ID" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

### With Custom Public ID

```bash
TIMESTAMP=$(date +%s)
PUBLIC_ID="my-folder/my-image"
SIGNATURE=$(echo -n "public_id=$PUBLIC_ID&timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/image/upload" -F "file=@/path/to/image.png" -F "public_id=$PUBLIC_ID" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

## Response

```json
{
  "public_id": "sample",
  "secure_url": "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.png",
  "url": "http://res.cloudinary.com/demo/image/upload/v1234567890/sample.png",
  "format": "png",
  "width": 800,
  "height": 600
}
```

Key field: `secure_url` — HTTPS delivery URL for the asset.

This example uses Cloudinary’s default **public** `upload` delivery type. A `secure_url` is still publicly reachable for public assets and must not be treated as universally safe for private media. For restricted media, use private delivery types or authenticated access ([delivery types](https://cloudinary.com/documentation/image_upload_api_reference)).

Use in Markdown: `![img](https://res.cloudinary.com/...)`

## URL Transformations

Cloudinary URLs support on-the-fly transformations:

```text
https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
```

Examples:

```text
# Resize to 300x200
.../image/upload/w_300,h_200/sample.png

# Auto format and quality
.../image/upload/f_auto,q_auto/sample.png

# Crop to square
.../image/upload/w_200,h_200,c_fill/sample.png

# Combine transformations
.../image/upload/w_400,h_300,c_fill,f_auto,q_auto/sample.png
```

## Video Concatenation (Splice)

Concatenate videos using URL transformations with `l_video:` (overlay) and `fl_splice` flag.

**Foldered public IDs:** In `l_video` overlays, encode folder slashes as colons. Example: public ID `folder/clip2` becomes `l_video:folder:clip2`. Source: Cloudinary overlay public-ID encoding (`/` → `:`) in the transformation builder.

### Basic Concatenation

Append `clip2` to the end of `clip1` (identical dimensions on base + overlay):

```text
https://res.cloudinary.com/{cloud_name}/video/upload/w_640,h_360,c_fill/l_video:clip2,fl_splice,w_640,h_360,c_fill/fl_layer_apply/clip1.mp4
```

Foldered example (`demos/clip2` → `l_video:demos:clip2`):

```text
https://res.cloudinary.com/{cloud_name}/video/upload/w_640,h_360,c_fill/l_video:demos:clip2,fl_splice,w_640,h_360,c_fill/fl_layer_apply/clip1.mp4
```

### Concatenate Multiple Videos

Append `clip2` and `clip3` to `clip1` with matching dimensions on every segment:

```text
https://res.cloudinary.com/{cloud_name}/video/upload/w_640,h_360,c_fill/l_video:clip2,fl_splice,w_640,h_360,c_fill/fl_layer_apply/l_video:clip3,fl_splice,w_640,h_360,c_fill/fl_layer_apply/clip1.mp4
```

### With Uniform Size

Resize all videos to same dimensions:

```text
https://res.cloudinary.com/{cloud_name}/video/upload/w_640,h_360,c_fill/l_video:clip2,fl_splice,w_640,h_360,c_fill/fl_layer_apply/clip1.mp4
```

### With Fade Transition

Use Cloudinary’s overlapping cross-fade on the splice (not separate per-clip `e_fade`):

```text
https://res.cloudinary.com/{cloud_name}/video/upload/w_640,h_360,c_fill/fl_splice:transition_(name_fade;du_1),l_video:clip2,w_640,h_360,c_fill/fl_layer_apply/clip1.mp4
```

Source: [Video transition effects — cross fade](https://cloudinary.com/documentation/video_transition_effects).

### Add Image as Intro (3 seconds)

Prepend an image as intro:

```text
https://res.cloudinary.com/{cloud_name}/video/upload/l_intro_image,fl_splice,du_3/so_0,fl_layer_apply/clip1.mp4
```

### Limitations

- URL length limit (~2000 chars) restricts number of videos ([HTTP URI practical limits / CDN delivery constraints](https://cloudinary.com/documentation/video_trimming_and_concatenating); long composed URLs fail at intermediaries)
- First request triggers server-side processing (slow) — Cloudinary generates derivatives on demand ([transformation overview](https://cloudinary.com/documentation/image_transformations))
- For many videos (10+), prefer server-side composition (e.g. ffmpeg) or dedicated video APIs to avoid URL-length and cold-processing failure modes documented above

## Delete Media

Include `invalidate=true` in the POST payload **and** in the SHA-1 signature string (alphabetical param order). Source: [Destroy API — `invalidate`](https://cloudinary.com/documentation/image_upload_api_reference).

```bash
TIMESTAMP=$(date +%s)
PUBLIC_ID="<your-public-id>"
SIGNATURE=$(echo -n "invalidate=true&public_id=$PUBLIC_ID&timestamp=$TIMESTAMP$CLOUDINARY_API_SECRET" | sha1sum | cut -d" " -f1)

# Delete image
curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/image/destroy" -F "public_id=$PUBLIC_ID" -F "invalidate=true" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"

# Delete video
curl -X POST "https://api.cloudinary.com/v1_1/<your-cloud-name>/video/destroy" -F "public_id=$PUBLIC_ID" -F "invalidate=true" -F "api_key=$CLOUDINARY_TOKEN" -F "timestamp=$TIMESTAMP" -F "signature=$SIGNATURE"
```

## Free Tier Limits

Cloudinary Free / self-service plans use a **credits** model ([billing and plans](https://cloudinary.com/documentation/billing_and_plans); [credits FAQ](https://cloudinary.com/documentation/developer_onboarding_faq_credits)):

- **25 credits** on the Free plan, usable across resource types
- Bandwidth is measured on a **rolling 30-day window** (or billing month, depending on plan)
- Resource rates (1 credit equals):
  - **1,000** new transformation derivatives
  - **1 GB** stored
  - **1 GB** delivered image bandwidth **or** **1 GB** delivered video bandwidth (Free; paid self-service may count 2 GB video per credit)

## Guidelines

1. **Prefer signed uploads** for authenticated/sensitive flows; unsigned presets only when locked down with `allowed_formats`, `max_file_size`, and `disallow_public_id` ([upload presets](https://cloudinary.com/documentation/upload_presets))
2. **Signature order**: Parameters must be alphabetically sorted when generating signature ([upload API authentication](https://cloudinary.com/documentation/image_upload_api_reference))
3. **Auto optimization**: Add `f_auto,q_auto` to URLs for automatic format/quality ([transformation reference](https://cloudinary.com/documentation/transformation_reference))
4. **Folders**: Use `public_id="folder/subfolder/name"` to organize media; encode `/` as `:` in `l_video` overlays
5. **Video concatenation**: Keep URLs short; for 10+ videos use external tools ([video concatenating](https://cloudinary.com/documentation/video_trimming_and_concatenating))

## API Reference

- Image Upload: https://cloudinary.com/documentation/image_upload_api_reference
- Video Upload: https://cloudinary.com/documentation/video_upload_api_reference
- Video Concatenation: https://cloudinary.com/documentation/video_trimming_and_concatenating
- Video Transitions: https://cloudinary.com/documentation/video_transition_effects
- Upload Presets: https://cloudinary.com/documentation/upload_presets
- Billing / Credits: https://cloudinary.com/documentation/billing_and_plans
- Console: https://console.cloudinary.com/
- Transformation Reference: https://cloudinary.com/documentation/transformation_reference
