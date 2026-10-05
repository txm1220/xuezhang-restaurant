/* ============================================================
   学长餐厅 · 主人后台
   粘贴归档 / 客人档案 / 晚宴汇总 / 数据备份
   数据保存在本机浏览器 localStorage，可用导出文件备份迁移
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'xz_admin_orders';

  function lsGet(k, def) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var data = lsGet(KEY, []);
  if (!Array.isArray(data)) data = [];

  function save() { lsSet(KEY, data); }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-999px;top:0;';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      toast(ok ? okMsg : '复制失败，请手动选择文字复制');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    } else fallback();
  }

  /* ---------- Tab 切换 ---------- */
  var tabs = document.querySelectorAll('.tab-chip');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) { o.classList.toggle('on', o === t); });
      document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('on', p.id === t.getAttribute('data-tab'));
      });
      if (t.getAttribute('data-tab') === 'tabSummary') renderSummary();
      if (t.getAttribute('data-tab') === 'tabGuests') renderGuests();
      if (t.getAttribute('data-tab') === 'tabOnline') fetchOnline();
    });
  });

  /* ============================================================
     线上点单（Supabase 收件箱）
     ============================================================ */
  var onlineRows = [];   // 云端拉到的点单
  var onlineTimer = null;

  function cloudHeaders() {
    return {
      'apikey': XZ_CLOUD.key,
      'Authorization': 'Bearer ' + XZ_CLOUD.key
    };
  }

  function archivedCloudIds() {
    var s = {};
    data.forEach(function (o) { if (o.cloudId) s[o.cloudId] = 1; });
    return s;
  }

  function fetchOnline() {
    if (typeof XZ_CLOUD === 'undefined' || !XZ_CLOUD.url || !XZ_CLOUD.key) {
      $('onlineStat').textContent = '云端暂未配置（联系助手开通后即可自动收单）';
      return;
    }
    fetch(XZ_CLOUD.url + '/rest/v1/orders?select=*&order=created_at.desc&limit=50', { headers: cloudHeaders() })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        onlineRows = Array.isArray(rows) ? rows : [];
        renderOnline();
      })
      .catch(function () {
        $('onlineStat').textContent = '网络不顺，稍后自动重试…';
      });
  }

  function renderOnline() {
    var done = archivedCloudIds();
    var fresh = onlineRows.filter(function (r) { return !done[r.id]; });
    $('onlineStat').textContent = '共 ' + onlineRows.length + ' 条线上点单 · ' + fresh.length + ' 条待归档 · 更新于 ' +
      new Date().toTimeString().slice(0, 5);

    if (!onlineRows.length) {
      $('onlineList').innerHTML = '<div class="empty-tip">还没有线上点单——客人在菜单页点「直接提交给主人」后会出现在这里</div>';
      $('onlineArchiveRow').style.display = 'none';
      return;
    }

    var html = onlineRows.map(function (r) {
      var isDone = !!done[r.id];
      var dishes = (r.dishes || []).map(function (d) {
        return (d.name || '') + (d.option ? '（' + d.option + '）' : '') + ' ×' + (d.qty || 1);
      }).join('；');
      var meta = [];
      if (r.restrictions) meta.push('忌口：' + r.restrictions);
      if (r.prefs) meta.push('口味：' + r.prefs);
      if (r.note) meta.push('备注：' + r.note);
      var time = (r.date_text || '').slice(5);
      return '<div class="preview-item' + (isDone ? '" style="opacity:.55' : '') + '">' +
        '<div class="pv-head">' +
        (isDone ? '<span class="pv-flag ok">已归档</span>' :
          '<input type="checkbox" class="online-ck" data-id="' + r.id + '" checked style="margin-right:8px;">') +
        '<span class="pv-name">' + esc(r.guest_name || '神秘客人') + '</span>' +
        '<span style="font-family:var(--sans);font-size:11px;color:var(--muted);">' + esc(time) + '</span></div>' +
        '<div class="pv-dishes">' + esc(dishes) + (meta.length ? '<br>' + esc(meta.join('　')) : '') + '</div></div>';
    }).join('');

    $('onlineList').innerHTML = html;
    $('onlineArchiveRow').style.display = fresh.length ? 'flex' : 'none';
  }

  $('btnArchiveOnline').addEventListener('click', function () {
    var ids = [];
    document.querySelectorAll('.online-ck:checked').forEach(function (ck) {
      ids.push(parseInt(ck.getAttribute('data-id'), 10));
    });
    if (!ids.length) { toast('先勾选要归档的点单'); return; }
    var done = archivedCloudIds();
    var added = 0;
    onlineRows.forEach(function (r) {
      if (ids.indexOf(r.id) < 0 || done[r.id]) return;
      data.push({
        id: XZ.uid(), addedTs: Date.now(), cloudId: r.id,
        date: r.date || (r.date_text || '').slice(0, 10),
        dateText: r.date_text || r.date || '',
        name: r.guest_name || '神秘客人',
        restrictions: r.restrictions || '',
        prefs: (r.prefs || '').split(/[;；、]/).map(function (s) { return s.trim(); }).filter(Boolean),
        note: r.note || '',
        dishes: r.dishes || []
      });
      added++;
    });
    if (!added) { toast('没有新的可归档点单'); return; }
    save();
    toast('已归档 ' + added + ' 条线上点单');
    renderOnline();
    renderGuests();
    renderSummaryOptions();
    var guestChip = document.querySelector('.tab-chip[data-tab="tabGuests"]');
    if (guestChip) guestChip.click();
  });

  /* 每 15 秒自动刷新（仅当收件箱页签在显示时请求） */
  onlineTimer = setInterval(function () {
    var panel = document.getElementById('tabOnline');
    if (panel && panel.classList.contains('on')) fetchOnline();
  }, 15000);

  /* ============================================================
     点单归档
     ============================================================ */
  var pending = [];   // 解析通过且不重复的

  function sig(o) {
    return o.name + '|' + o.date + '|' + o.dishes.map(function (d) {
      return d.name + (d.option || '') + 'x' + d.qty;
    }).sort().join(',');
  }

  $('btnParse').addEventListener('click', function () {
    var text = $('pasteBox').value;
    if (!text.trim()) { toast('先粘贴点单卡的文字'); return; }

    var results = XZ.parseCards(text);
    if (!results.length) { toast('没读到内容，确认粘贴了完整的点菜单'); return; }

    var sigs = {};
    data.forEach(function (o) { sigs[sig(o)] = true; });

    pending = [];
    var html = '';
    results.forEach(function (r) {
      if (!r.ok) {
        html += '<div class="preview-item err"><div class="pv-head"><span class="pv-flag bad">无法识别</span></div>' +
          '<div class="pv-dishes">' + esc(r.error) + '</div></div>';
        return;
      }
      var o = r.order;
      var dup = sigs[sig(o)];
      var dishesTxt = o.dishes.map(function (d) {
        return d.name + (d.option ? '（' + d.option + '）' : '') + ' ×' + d.qty;
      }).join('；');
      var meta = [];
      if (o.restrictions) meta.push('忌口：' + o.restrictions);
      if (o.prefs.length) meta.push('口味：' + o.prefs.join('、'));
      if (o.note) meta.push('备注：' + o.note);
      html += '<div class="preview-item"><div class="pv-head">' +
        '<span class="pv-name">' + esc(o.name) + '</span>' +
        '<span class="pv-flag ' + (dup ? 'dup' : 'ok') + '">' + (dup ? '已归档过' : '可归档') + '</span>' +
        '<span style="font-family:var(--sans);font-size:11px;color:var(--muted);">' + esc(o.dateText) + '</span></div>' +
        '<div class="pv-dishes">' + esc(dishesTxt) + (meta.length ? '<br>' + esc(meta.join('　')) : '') + '</div></div>';
      if (!dup) pending.push(o);
    });

    $('previewList').innerHTML = html;
    $('archiveRow').style.display = pending.length ? 'flex' : 'none';
    if (!pending.length) toast('没有新的可归档点单（可能都重复了）');
  });

  $('btnArchive').addEventListener('click', function () {
    if (!pending.length) return;
    pending.forEach(function (o) {
      data.push({
        id: XZ.uid(), addedTs: Date.now(),
        date: o.date, dateText: o.dateText, name: o.name,
        restrictions: o.restrictions, prefs: o.prefs, note: o.note, dishes: o.dishes
      });
    });
    save();
    toast('已归档 ' + pending.length + ' 张点单');
    pending = [];
    $('pasteBox').value = '';
    $('previewList').innerHTML = '';
    $('archiveRow').style.display = 'none';
    renderGuests();
    renderSummaryOptions();   // 日期下拉同步新增的晚宴
    // 归档成功后直接跳到「客人档案」，让结果立刻可见
    var guestChip = document.querySelector('.tab-chip[data-tab="tabGuests"]');
    if (guestChip) guestChip.click();
  });

  /* ============================================================
     客人档案
     ============================================================ */
  function groupGuests() {
    var m = {};
    data.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .forEach(function (o) { (m[o.name] = m[o.name] || []).push(o); });
    return Object.keys(m).map(function (n) { return { name: n, orders: m[n] }; })
      .sort(function (a, b) {
        return b.orders[b.orders.length - 1].date < a.orders[a.orders.length - 1].date ? -1 : 1;
      });
  }

  function renderGuests() {
    var q = $('guestSearch').value.trim();
    var guests = groupGuests().filter(function (g) {
      return !q || g.name.indexOf(q) >= 0;
    });

    $('guestStat').textContent = '共 ' + guests.length + ' 位客人 · ' + data.length + ' 张点单';

    if (!guests.length) {
      $('guestCards').innerHTML = '<div class="empty-tip" style="grid-column:1/-1;">' +
        (q ? '没找到这位客人' : '还没有档案 —— 先去「点单归档」粘贴客人的点菜单') + '</div>';
      return;
    }

    $('guestCards').innerHTML = guests.map(function (g) {
      var os = g.orders;
      var first = os[0], last = os[os.length - 1];

      // 菜品记忆
      var cnt = {};
      os.forEach(function (o) {
        o.dishes.forEach(function (d) {
          var k = d.name + (d.option ? '（' + d.option + '）' : '');
          cnt[k] = (cnt[k] || 0) + d.qty;
        });
      });
      var dishTxt = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })
        .map(function (k) { return '<b>' + esc(k) + '</b> ×' + cnt[k]; }).join('；');

      // 忌口取最近一次非空
      var restrict = '';
      for (var i = os.length - 1; i >= 0; i--) {
        if (os[i].restrictions) { restrict = os[i].restrictions; break; }
      }

      // 口味合并
      var prefSet = {};
      os.forEach(function (o) { o.prefs.forEach(function (p) { prefSet[p] = 1; }); });
      var prefChips = Object.keys(prefSet).map(function (p) {
        return '<span class="mini-tag">' + esc(p) + '</span>';
      }).join('');

      // 最近备注
      var notes = [];
      for (var j = os.length - 1; j >= 0 && notes.length < 2; j--) {
        if (os[j].note) notes.push(os[j].date.slice(5) + '：' + os[j].note);
      }

      return '<div class="card guest-card">' +
        '<div><span class="gc-name">' + esc(g.name) + '</span>' +
        '<span class="gc-visits">' + os.length + ' 次点单</span></div>' +
        '<div class="stat-line">首次 ' + esc(first.date) + ' · 最近 ' + esc(last.date) + '</div>' +
        '<div class="gc-block"><div class="gc-label">吃过的菜</div><div class="gc-dishes">' +
        (dishTxt || '—') + '</div></div>' +
        '<div class="gc-block"><div class="gc-label">忌口 / 过敏</div><div class="gc-restrict">' +
        (restrict ? esc(restrict) : '无') + '</div></div>' +
        (prefChips ? '<div class="gc-block"><div class="gc-label">口味爱好</div><div>' + prefChips + '</div></div>' : '') +
        (notes.length ? '<div class="gc-block"><div class="gc-label">备注</div><div class="gc-note">' +
          notes.map(esc).join('<br>') + '</div></div>' : '') +
        '</div>';
    }).join('');
  }

  $('guestSearch').addEventListener('input', renderGuests);

  /* ============================================================
     晚宴汇总
     ============================================================ */
  var secLabels = MENU.sections.map(function (s) { return s.label; });
  var secEnMap = {};
  MENU.sections.forEach(function (s) { secEnMap[s.label] = s.en; });

  function renderSummaryOptions() {
    var dates = [];
    data.forEach(function (o) { if (dates.indexOf(o.date) < 0) dates.push(o.date); });
    dates.sort().reverse();
    $('sumDate').innerHTML = dates.map(function (d) {
      return '<option value="' + d + '">' + d + '（' + countGuests(d) + ' 位客人）</option>';
    }).join('') + '<option value="全部">全部历史汇总</option>';
  }

  function countGuests(date) {
    var s = {};
    data.forEach(function (o) { if (o.date === date) s[o.name] = 1; });
    return Object.keys(s).length;
  }

  function renderSummary() {
    var d = $('sumDate').value;
    if (!d) { $('sumArea').innerHTML = '<div class="empty-tip">还没有归档任何点单</div>'; return; }
    var orders = d === '全部' ? data.slice() : data.filter(function (o) { return o.date === d; });
    if (!orders.length) { $('sumArea').innerHTML = '<div class="empty-tip">这一天还没有归档点单</div>'; return; }

    // 按分节聚合
    var order_ = secLabels.slice();
    var bySec = {};
    orders.forEach(function (o) {
      o.dishes.forEach(function (dk) {
        var sec = dk.section;
        if (order_.indexOf(sec) < 0) order_.push(sec);
        bySec[sec] = bySec[sec] || {};
        var k = dk.name + (dk.option ? '（' + dk.option + '）' : '');
        bySec[sec][k] = (bySec[sec][k] || 0) + dk.qty;
      });
    });

    // 客人明细
    var gm = {};
    orders.forEach(function (o) { (gm[o.name] = gm[o.name] || []).push(o); });
    var names = Object.keys(gm);

    var guestsHtml = names.map(function (n) {
      var seen = {}, ds = [];
      gm[n].forEach(function (o) {
        o.dishes.forEach(function (d) {
          var k = d.name + (d.option ? '（' + d.option + '）' : '');
          if (!seen[k]) { seen[k] = 1; ds.push(k); }
        });
      });
      var restrict = '';
      for (var i = gm[n].length - 1; i >= 0; i--) if (gm[n][i].restrictions) { restrict = gm[n][i].restrictions; break; }
      return '<div><b>' + esc(n) + '</b>：' + esc(ds.join('、')) +
        (restrict ? '<span class="gc-restrict">（忌口：' + esc(restrict) + '）</span>' : '') + '</div>';
    }).join('');

    var secsHtml = '';
    order_.forEach(function (sec) {
      if (!bySec[sec]) return;
      var rows = Object.keys(bySec[sec]).sort(function (a, b) { return bySec[sec][b] - bySec[sec][a]; })
        .map(function (k) {
          return '<div class="sum-row"><span class="n">' + esc(k) + '</span><span class="q">×' + bySec[sec][k] + '</span></div>';
        }).join('');
      secsHtml += '<div class="sum-sec"><div class="sum-sec-name">' + esc(sec + ' · ' + (secEnMap[sec] || '')) + '</div>' + rows + '</div>';
    });

    $('sumArea').innerHTML =
      '<div class="sum-paper">' +
      '<div class="sum-title">晚 宴 汇 总</div>' +
      '<div class="sum-sub">' + esc(d === '全部' ? 'ALL DINNERS' : d) + ' · ' + names.length + ' GUESTS</div>' +
      secsHtml +
      '<div class="sum-guests">' + guestsHtml + '</div>' +
      '<div class="sum-foot">致主厨：客人已点单，开火吧 🔥</div>' +
      '</div>' +
      '<div class="btn-row"><button class="btn btn-primary" id="btnCopySum">复制汇总文字</button></div>';

    // 复制用的纯文本
    var t = [];
    t.push('【学长餐厅 · 后厨汇总】' + (d === '全部' ? '全部历史' : d));
    t.push('客人（' + names.length + '位）：' + names.join('、'));
    t.push(XZ.SEP);
    order_.forEach(function (sec) {
      if (!bySec[sec]) return;
      t.push(sec);
      Object.keys(bySec[sec]).sort(function (a, b) { return bySec[sec][b] - bySec[sec][a]; })
        .forEach(function (k) { t.push('· ' + k + ' ×' + bySec[sec][k]); });
    });
    t.push(XZ.SEP);
    names.forEach(function (n) {
      var restrict = '';
      for (var i = gm[n].length - 1; i >= 0; i--) if (gm[n][i].restrictions) { restrict = gm[n][i].restrictions; break; }
      if (restrict) t.push('忌口 · ' + n + '：' + restrict);
    });
    t.push(XZ.SEP);
    t.push('致主厨：客人已点单，开火吧 🔥');
    var sumText = t.join('\n');

    $('btnCopySum').addEventListener('click', function () {
      copyText(sumText, '汇总已复制，发给主厨吧');
    });
  }

  $('sumDate').addEventListener('change', renderSummary);

  /* ============================================================
     数据备份
     ============================================================ */
  $('btnExport').addEventListener('click', function () {
    var payload = {
      app: 'xuezhang-restaurant', exportedAt: new Date().toISOString(), orders: data
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    var d = XZ.fmtDate(new Date()).replace(/-/g, '');
    a.download = '学长餐厅数据备份-' + d + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast('备份已导出，建议存到微信收藏或网盘');
  });

  $('btnImport').addEventListener('click', function () { $('importFile').click(); });

  $('importFile').addEventListener('change', function (ev) {
    var f = ev.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var j = JSON.parse(reader.result);
        var arr = j.orders || j;   // 兼容直接是数组
        if (!Array.isArray(arr)) throw new Error('bad');
        var ids = {};
        data.forEach(function (o) { ids[o.id] = 1; });
        var added = 0;
        arr.forEach(function (o) {
          if (o && o.name && Array.isArray(o.dishes)) {
            if (!o.id || !ids[o.id]) {
              if (!o.id) o.id = XZ.uid();
              ids[o.id] = 1;
              if (!o.date && o.dateText) o.date = o.dateText.slice(0, 10);
              data.push(o);
              added++;
            }
          }
        });
        save();
        renderGuests();
        renderSummaryOptions();
        toast(added ? '导入成功，新增 ' + added + ' 条' : '导入完成，没有新数据（可能都重复）');
      } catch (e) {
        toast('文件格式不对，导入失败');
      }
      ev.target.value = '';
    };
    reader.readAsText(f);
  });

  $('btnWipe').addEventListener('click', function () {
    if (!confirm('确定清空本机全部归档数据？此操作不可恢复。')) return;
    if (!confirm('再确认一次：真的要清空吗？（已导出的备份文件不受影响）')) return;
    data = [];
    save();
    renderGuests();
    renderSummaryOptions();
    toast('已清空');
  });

  /* ---------- 初始化 ---------- */
  renderGuests();
  renderSummaryOptions();
  fetchOnline();

})();
