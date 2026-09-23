browser.runtime.onMessage.addListener(async message => {
  if (message?.type === "markdownload.offscreen.ping") return true;
  if (message?.type !== "markdownload.offscreen.request") return;

  const data = message.data || {};
  switch (message.action) {
    case "getArticleFromDom":
      return getArticleFromDom(data.domString);
    case "convertArticleToMarkdown":
      return convertArticleToMarkdown(data.article, data.downloadImages, data.options);
    case "turndown":
      return turndown(data.content, data.options, data.article);
    case "createObjectUrl":
      return URL.createObjectURL(new Blob([data.data], { type: data.type }));
    case "revokeObjectUrl":
      URL.revokeObjectURL(data.url);
      return true;
    default:
      throw new Error(`Unknown offscreen action: ${message.action}`);
  }
});
