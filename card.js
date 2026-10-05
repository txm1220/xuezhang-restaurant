/* ============================================================
   点单卡：生成与解析（客人端 / 主人端共用，格式只在这里定义）
   ------------------------------------------------------------
   文字卡格式（主人后台靠固定格式反向解析，请勿改动格式）：

   【学长餐厅·点菜单】
   客人：王小雨
   日期：2026-10-04 19:42
   忌口：不吃香菜
   口味：爱吃辣；大胃口
   备注：无
   ——————
   小食｜慢煮溏心蛋 · 葱油鱼子酱 ×2
   主菜｜M7干式熟成牛排(五分) ×1
   ——————
   学长餐厅 · 中西融合创意菜
   ============================================================ */

var XZ = (function () {

  var SEP = "——————";
  var HEADER = "【学长餐厅·点菜单】";

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function fmtDate(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function fmtDateTime(d) {
    return fmtDate(d) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  /* order = { name, restrictions, prefs:[], note, dishes:[{section,name,option,qty}], dateText } */
  function formatCard(order) {
    var lines = [];
    lines.push(HEADER);
    lines.push("客人：" + (order.name || "神秘客人"));
    lines.push("日期：" + (order.dateText || fmtDateTime(new Date())));
    lines.push("忌口：" + (order.restrictions ? order.restrictions.trim() : "无"));
    lines.push("口味：" + (order.prefs && order.prefs.length ? order.prefs.join("；") : "随意"));
    lines.push("备注：" + (order.note ? order.note.trim() : "无"));
    lines.push(SEP);
    order.dishes.forEach(function (d) {
      var name = d.name + (d.option ? "(" + d.option + ")" : "");
      lines.push(d.section + "｜" + name + " ×" + d.qty);
    });
    lines.push(SEP);
    lines.push(MENU.restaurant + " · " + MENU.subtitle);
    return lines.join("\n");
  }

  /* 解析一张卡 → {ok:true, order} 或 {ok:false, error}
     容错设计：客人转发时可能手改了文字，尽量宽松匹配 */
  function parseCard(text) {
    var lines = String(text || "").split(/\r?\n/).map(function (s) { return s.trim(); });
    var o = { name: "", dateText: "", restrictions: "", prefs: [], note: "", dishes: [] };
    // 菜品行：「分类｜菜名(选项) ×数量」，×/x/＊ 均可，｜或|均可
    var dishRe = /^(?:·\s*)?([^｜|]+?)[｜|]\s*(.+?)\s*(?:[（(]([^（）()]*?)[）)])?\s*[×xX＊*]\s*(\d+)$/;

    lines.forEach(function (ln) {
      if (!ln || ln === SEP) return;           // 分隔线与空行跳过
      if (ln.indexOf("【") === 0) return;      // 卡头跳过
      var m;
      if ((m = ln.match(/^客人[：:]\s*(.+)$/))) { o.name = m[1].trim(); return; }
      if ((m = ln.match(/^日期[：:]\s*(.+)$/))) { o.dateText = m[1].trim(); return; }
      if ((m = ln.match(/^忌口[：:]\s*(.+)$/)) && m[1] !== "无") { o.restrictions = m[1].trim(); return; }
      if ((m = ln.match(/^口味[：:]\s*(.+)$/)) && m[1] !== "随意" && m[1] !== "无") {
        o.prefs = m[1].split(/[;；、]/).map(function (s) { return s.trim(); }).filter(Boolean);
        return;
      }
      if ((m = ln.match(/^备注[：:]\s*(.+)$/)) && m[1] !== "无") { o.note = m[1].trim(); return; }
      if ((m = ln.match(dishRe))) {
        o.dishes.push({
          section: m[1].trim(),
          name: m[2].trim(),
          option: m[3] || "",
          qty: parseInt(m[4], 10) || 1
        });
      }
      // 其余行（页脚等）忽略
    });

    if (!o.dishes.length) return { ok: false, error: "没认出任何菜品，请确认粘贴的是完整点菜单" };
    if (!o.name) return { ok: false, error: "没认出客人昵称（需要「客人：某某」这一行）" };
    if (!/^\d{4}-\d{2}-\d{2}/.test(o.dateText)) o.dateText = fmtDateTime(new Date());
    o.date = o.dateText.slice(0, 10); // 主人端按日期归组用
    return { ok: true, order: o };
  }

  /* 一次粘贴里可能有多张卡（群里转发的聊天记录），按卡头切开逐张解析 */
  function parseCards(text) {
    var parts = String(text || "").split(/【学长餐厅·点菜单】+/);
    var out = [];
    parts.forEach(function (p) {
      p = p.trim();
      if (p) out.push(parseCard(p));
    });
    return out;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  return {
    HEADER: HEADER,
    SEP: SEP,
    fmtDate: fmtDate,
    fmtDateTime: fmtDateTime,
    formatCard: formatCard,
    parseCard: parseCard,
    parseCards: parseCards,
    uid: uid
  };
})();
