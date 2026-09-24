(function addLatexToMathJax3() {
    try {
        var mj = (typeof window !== "undefined") ? window.MathJax : (typeof globalThis !== "undefined" ? globalThis.MathJax : null);
        if (!mj || !mj.startup || !mj.startup.document || !Array.isArray(mj.startup.document.math)) {
            return;
        }

        for (var i = 0; i < mj.startup.document.math.length; i++) {
            var math = mj.startup.document.math[i];
            if (math && math.typesetRoot && typeof math.typesetRoot.setAttribute === "function") {
                math.typesetRoot.setAttribute("markdownload-latex", math.math || "");
            }
        }
    } catch (e) {
        // Silently ignore if page has incompatible or partial MathJax
    }
})();
