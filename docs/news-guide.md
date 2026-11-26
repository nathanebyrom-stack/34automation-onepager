# Writing a News post

News lives at `/news/`. Each post is one text file in `content/news/`, and gets its own page at
`/news/<file-name>/`. The three newest also show on the home page, just above the contact form.
Nothing on the home page changes while there are no posts.

## Add a post

1. Copy `content/news/_template.md` and rename the copy. The file name becomes the web address, so keep it
   short, lower-case, words joined by hyphens: `choosing-a-cnc-subcontractor.md` → `/news/choosing-a-cnc-subcontractor/`.
   Don't rename a post once it's live: its address would change and links to it would break.
2. Fill in the header between the two `---` lines:

   | Line | What goes in |
   |---|---|
   | `title` | The headline. Up to 110 characters. Also the title Google shows. |
   | `date` | Publish date, `YYYY-MM-DD`. The newest date shows first. |
   | `author` | Who wrote it, e.g. `Scott`. |
   | `summary` | One or two sentences, up to 200 characters. Shows on the list, the home page and in Google. |
   | `image` | Optional cover picture: just the file name, e.g. `cnc-quote.webp`. See "Cover picture" below. |
   | `imageAlt` | Needed with `image`: what the picture shows, for someone who can't see it. |
   | `draft` | Leave `draft: true` while you're writing. Delete the line to publish. |

3. Write the post under the header. `## Subheading`, `**bold**`, `*italic*`, `[link text](https://…)`,
   `- list item` and `> quote` all work. Raw HTML doesn't: it shows as text, on purpose.
4. **Cover picture (optional, recommended).** It runs edge to edge across the top of the post's card on the
   home page and the News list, sits under the summary on the post itself, and is the preview picture when the
   post is shared on LinkedIn.
   - Size: **1600 × 900 px** (16:9), WebP or JPG, under about 300 KB.
   - No words in the picture, and nothing important within 60 px of any edge: LinkedIn trims the top and bottom slightly.
   - Put it in `public/news/img/` and give its file name in the `image` line.
   Without one, the card shows text only and LinkedIn uses the site's own share picture.
5. Pictures inside the post go in `public/news/img/` (WebP, about 1600px wide) and in the post as
   `![what the picture shows](/news/img/name.webp)`. Always describe the picture.
6. Every post goes through humanize and slop-gate before it's published. No made-up figures, results or quotes.
7. Commit to a branch and open a pull request: Cloudflare builds a preview link to check it. Merge to `main` to publish.

If a header line is wrong (no summary, a bad date), the build stops and says which file and what to fix,
so a broken post never goes live. Files starting with `_` (like the template) are never published.

The sitemap picks up every post automatically, so Google finds new posts without anything else to do.
