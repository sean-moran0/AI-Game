// Chat UI: posts the full message history to /api/chat and renders the reply.
const $messages = $("#messages");
const $input = $("#input");
const $send = $("#send");
const history = [];

function appendMessage(role, content) {
    const $el = $("<div></div>").addClass(`message ${role}`).text(content);
    $messages.append($el);
    $messages.scrollTop($messages.prop("scrollHeight"));
    return $el;
}

async function send() {
    const text = String($input.val() ?? "").trim();
    if (!text) return;

    $input.val("").css("height", "");
    $send.prop("disabled", true);
    history.push({ role: "user", content: text });
    appendMessage("user", text);
    const $thinking = appendMessage("assistant", "…");

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: history }),
        });
        const data = await res.json();
        if (!res.ok) {
            $thinking.attr("class", "message error").text(data.error ?? "Something went wrong.");
            history.pop();
            return;
        }
        $thinking.text(data.response);
        history.push({ role: "assistant", content: data.response });
    } catch {
        $thinking.attr("class", "message error").text("Could not reach the server.");
        history.pop();
    } finally {
        $send.prop("disabled", false);
        $input.trigger("focus");
        $messages.scrollTop($messages.prop("scrollHeight"));
    }
}

$send.on("click", send);

$input.on("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});

// Auto-resize textarea up to a max height.
$input.on("input", () => {
    $input.css("height", "");
    $input.css("height", Math.min($input.prop("scrollHeight"), 140) + "px");
});
