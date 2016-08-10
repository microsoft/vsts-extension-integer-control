define(["require", "exports"], function (require, exports) {
    "use strict";
    var ErrorView = (function () {
        function ErrorView(error) {
            var container = $("<div />");
            container.addClass("container");
            var warning = $("<p />");
            warning.text(error);
            warning.attr("title", error);
            container.append(warning);
            var help = $("<p />");
            help.text("See ");
            var a = $("<a> </a>");
            a.attr("href", "https://www.visualstudio.com/en-us/products/visual-studio-team-services-vs.aspx");
            a.attr("target", "_blank");
            a.text("Documentation.");
            help.append(a);
            container.append(help);
            $('body').empty().append(container);
        }
        return ErrorView;
    }());
    exports.ErrorView = ErrorView;
});
