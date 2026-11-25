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
   | `draft` | Leave `draft: true` while you're writing. Delete the line to publish. |

3. Write the post under the header. `## Subheading`, `**bold**`, `*italic*`, `[link text](https://…)`,
   `- list item` and `> quote` all work. Raw HTML doesn't: it shows as text, on purpose.
4. Pictures go in `public/news/img/` (WebP, about 1600px wide) and in the post as
   `![what the picture shows](/news/img/name.webp)`. Always describe the picture.
5. Every post goes through humanize and slop-gate before it's published. No made-up figures, results or quotes.
6. Commit to a branch and open a pull request: Cloudflare builds a preview link to check it. Merge to `main` to publish.

If a header line is wrong (no summary, a bad date), the build stops and says which file and what to fix,
so a broken post never goes live. Files starting with `_` (like the template) are never published.

The sitemap picks up every post automatically, so Google finds new posts without anything else to do.
