$(document).ready(function() {
    var $qs = $("#questions-section");
    $.getJSON("/questions", function(promptConfig) {
        console.log(promptConfig, arguments);
        var questions = promptConfig.define || {};
        for (var k in questions) {
            render(k, questions[k]);
        }
    });

    $("#submit").click(function() {
        let answers = $(".question")
            .get()
            .reduce(function(p, c) {
                console.log(c);
                var key = $(c).data("key");
                p[key] = $(c).find("input").val();
                console.log(key, p[key]);
                return p;
            }, {});

        $.ajax({
            "url" : "/",
            "type": "POST",
            "data": JSON.stringify(answers),
            "contentType": "application/json; charset=utf-8",
            "dataType": "json",
            "success": successfulPost});
    });

    function successfulPost() {
        //window.close(); // closes ALL tabs. This is why we try to launch browsers in new window mode.
    }

    function render(k, q) {
        var frag = $("<div class='question'><label>Define " + k + "<input type='text' name='" + k + "' /></label></div>");
        frag.data("key", k);
        $qs.append(frag);
    }
});