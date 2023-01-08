/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.tsx", "../common/src/**/*.tsx"],
  theme: {
    extend: {
      backgroundImage: {
        changed:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='1em' height='0.9em'%3E%3Cpath fill='red' d='M32 1.625 1.479 62.748H62.52l-2.167-4.34zm0 13.432 20.818 41.691H11.182Z' /%3E%3Cpath d='M32 4.984 3.904 61.248h56.192l-1.084-2.17zm0 6.715 23.244 46.549H8.756Z' /%3E%3C/svg%3E\")",
        unchanged:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='1em' height='0.9em'%3E%3Cpath d='M32 1.625 1.479 62.748H62.52l-2.167-4.34zm0 13.432 20.818 41.691H11.182Z' fill='%230f0' /%3E%3Cpath d='M32 4.984 3.904 61.248h56.192l-1.084-2.17zm0 6.715 23.244 46.549H8.756Z' /%3E%3C/svg%3E\")",
        failed:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='1em' height='0.9em'%3E%3Cpath d='M32 1.625 1.479 62.748H62.52l-2.167-4.34zm0 13.432 20.818 41.691H11.182Z' fill='%23666' /%3E%3Cpath d='M32 4.984 3.904 61.248h56.192l-1.084-2.17zm0 6.715 23.244 46.549H8.756Z' fill='%23ccc' /%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
