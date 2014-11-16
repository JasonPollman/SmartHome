$(document).on("pagecreate", "#rules", function () {

    // Grab the rule placholder from the DOM so we can use it for modification:
    var pesduoRule = $(this).find('#pseduo-rule');
    // Remove it from the DOM
    pesduoRule.detach();

    // When a rule is added to the database:
    FIREBASE_RULES_OBJ.child("device_rules").on("child_added", setRule);
    FIREBASE_RULES_OBJ.child("device_rules").on("child_changed", setRule);

    function setRule (child) {

        // Clone the pesduoRule for modification...
        var newRule = pesduoRule.clone();

        var rule = child.val();
        var ruleName = child.name();

        if( // Make sure we have the fields we need:
            !(rule instanceof Object)
        ) {
            console.log("Rule " + ruleName + " is missing required fields!");
            return false;
        }
        else if(
            Object.keys(rule).indexOf("source_mac")   <= -1 ||
            Object.keys(rule).indexOf("target_mac")   <= -1 ||
            Object.keys(rule).indexOf("alias")  <= -1

        ) {
            console.log("Rule " + ruleName + " is missing required fields!");
            return false;
        }

        newRule.attr("id", ruleName);
        newRule.find(".rule-title").html(UCFirst(rule.alias));
        newRule.find(".rule-source-device").html(UCFirst(global[DEVICES_GLOBAL][rule.source_mac].name.replace(/[^a-z0-9\s]/ig, ' ')));
        newRule.find(".rule-target-device").html(UCFirst(global[DEVICES_GLOBAL][rule.target_mac].name.replace(/[^a-z0-9\s]/ig, ' ')));

        newRule.find(".rule-href").attr("href", "rule.html?id=" + ruleName);

        var ruleElem;

        if($("#my-rules").find("#" + ruleName).length > 0) {
            ruleElem = $("#my-rules").find("#" + ruleName);
        }
        else {
            $("#my-rules").append('<div id="' + ruleName + '"></div>');
            ruleElem = $('#' + ruleName);

        } // End if/else block

        ruleElem.replaceWith(newRule);
    }

    // When a rule is removed from the database:
    FIREBASE_RULES_OBJ.on("child_removed", function (child) {
        var ruleName = child.name();
        $("#my-rules").find("#" + ruleName).remove();
    });

    $("#add-rule").click(function (e) {

        e.stopPropagation();
        e.preventDefault();

        var newRule = {
            source_mac: global[DEVICES_GLOBAL][Object.keys(global[DEVICES_GLOBAL])[0]].mac,
            target_mac: global[DEVICES_GLOBAL][Object.keys(global[DEVICES_GLOBAL])[0]].mac,
            source_path: [],
            source_value: [],
            target_path: [],
            target_value: [],
            alias: "New Rule",
            enabled: true
        }

        var newRuleID = FIREBASE_RULES_OBJ.child("device_rules").push(newRule);
        $.mobile.changePage('rule.html?id=' + newRuleID.name());
    })

});