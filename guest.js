/* ============================================================
   学长餐厅 · 客人端逻辑
   菜单展示 / 点单 / 生成点菜单卡（图片+文字）/ 我的历史
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function lsGet(k, def) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- 状态 ---------- */
  var cart = {};      // 菜名 -> { name, section, option, qty }
  var prefs = [];     // 选中的口味标签
  var cardText = '';  // 最近生成的点单卡文字

  var TAGCLS = { "招牌": "tag-star", "推荐": "tag-rec", "可素": "tag-veg", "辣": "tag-spicy", "微辣": "tag-spicy" };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- 页眉 ---------- */
  $('mhName').textContent = MENU.restaurant;
  $('mhEn').textContent = MENU.english;
  $('mhSub').textContent = MENU.subtitle;
  if (MENU.subtitleEn) $('mhSubEn').textContent = MENU.subtitleEn;
  $('mhSeason').textContent = MENU.season;
  $('mfNote').textContent = MENU.footerNote;

  /* ---------- 新手提示 ---------- */
  if (lsGet('xz_hint_off')) $('hintBar').style.display = 'none';
  $('hintClose').addEventListener('click', function () {
    $('hintBar').style.display = 'none';
    lsSet('xz_hint_off', 1);
  });

  /* ---------- 渲染菜单 ---------- */
  var navEl = $('sectionNav');
  var bodyEl = $('menuBody');
  var secOrder = [];

  MENU.sections.forEach(function (sec) {
    secOrder.push(sec.label);
    var chip = document.createElement('button');
    chip.className = 'nav-chip';
    chip.textContent = sec.label;
    chip.setAttribute('data-sec', sec.id);
    chip.addEventListener('click', function () {
      var el = $('sec-' + sec.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    navEl.appendChild(chip);

    var wrap = document.createElement('section');
    wrap.className = 'menu-section';
    wrap.id = 'sec-' + sec.id;

    var head = '<div class="sec-head"><div class="sec-en">' + esc(sec.en) + '</div>' +
      '<div class="sec-cn">' + esc(sec.label) + '</div></div>';
    if (sec.note) head += '<div class="sec-note">' + esc(sec.note) + '</div>';

    var items = sec.items.map(function (it) {
      var tags = (it.tags || []).map(function (t) {
        return '<span class="tag ' + (TAGCLS[t] || '') + '">' + esc(t) + '</span>';
      }).join('');
      return '<div class="dish" data-name="' + esc(it.name) + '">' +
        '<div class="dish-head"><span class="dish-name">' + esc(it.name) + '</span>' + tags + '</div>' +
        (it.en ? '<div class="dish-en">' + esc(it.en) + '</div>' : '') +
        (it.desc ? '<div class="dish-desc">' + esc(it.desc) + '</div>' : '') +
        '<span class="qty-badge"></span></div>';
    }).join('');

    wrap.innerHTML = head + items;
    bodyEl.appendChild(wrap);
  });

  /* 分节导航高亮 */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace('sec-', '');
        var chips = navEl.querySelectorAll('.nav-chip');
        for (var i = 0; i < chips.length; i++) {
          chips[i].classList.toggle('on', chips[i].getAttribute('data-sec') === id);
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    MENU.sections.forEach(function (sec) { io.observe($('sec-' + sec.id)); });
  }

  /* ---------- 点菜 ---------- */
  bodyEl.addEventListener('click', function (ev) {
    var row = ev.target.closest ? ev.target.closest('.dish') : null;
    if (!row) return;
    var name = row.getAttribute('data-name');
    var meta = DISH_INDEX[name];
    if (!meta) return;
    if (!cart[name]) {
      var opts = meta.item.options;
      cart[name] = {
        name: name,
        section: meta.section,
        option: opts ? opts[Math.floor(opts.length / 2)] : '',
        qty: 0
      };
    }
    cart[name].qty++;
    updateBadges();
    updateBar();
  });

  function updateBadges() {
    document.querySelectorAll('.dish').forEach(function (row) {
      var n = row.getAttribute('data-name');
      var badge = row.querySelector('.qty-badge');
      var q = cart[n] ? cart[n].qty : 0;
      if (q > 0) {
        badge.classList.remove('show');
        void badge.offsetWidth;            // 重触发动画
        badge.textContent = q;
        badge.classList.add('show');
      } else {
        badge.classList.remove('show');
        badge.textContent = '';
      }
    });
  }

  function cartCount() {
    var items = 0, qty = 0;
    Object.keys(cart).forEach(function (k) { items++; qty += cart[k].qty; });
    return { items: items, qty: qty };
  }

  function updateBar() {
    var c = cartCount();
    $('bbCount').textContent = c.items;
    $('bbQty').textContent = c.qty;
  }

  /* ---------- 抽屉开关 ---------- */
  function openSheet(id) { $(id).classList.add('open'); }
  function closeSheet(id) { $(id).classList.remove('open'); }

  document.querySelectorAll('.sheet').forEach(function (sh) {
    sh.addEventListener('click', function (ev) {
      if (ev.target === sh) closeSheet(sh.id);   // 点背板关闭
    });
  });
  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeSheet(btn.getAttribute('data-close')); });
  });

  $('btnOpenOrder').addEventListener('click', function () { renderCart(); openSheet('sheetOrder'); });
  $('btnHistory').addEventListener('click', function () { renderHistory(); openSheet('sheetHistory'); });

  /* ---------- 口味标签 ---------- */
  function renderPrefs() {
    var box = $('prefChips');
    box.innerHTML = '';
    MENU.prefOptions.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (prefs.indexOf(p) >= 0 ? ' on' : '');
      b.textContent = p;
      b.addEventListener('click', function () {
        var i = prefs.indexOf(p);
        if (i >= 0) prefs.splice(i, 1); else prefs.push(p);
        b.classList.toggle('on');
      });
      box.appendChild(b);
    });
  }
  renderPrefs();

  /* ---------- 点单清单 ---------- */
  function renderCart() {
    var box = $('cartList');
    var keys = Object.keys(cart);
    if (!keys.length) {
      box.innerHTML = '<div class="empty-tip">还没点菜 —— 回菜单里点几道再来</div>';
      return;
    }
    keys.sort(function (a, b) {
      return secOrder.indexOf(cart[a].section) - secOrder.indexOf(cart[b].section);
    });
    box.innerHTML = keys.map(function (k) {
      var d = cart[k];
      var opt = '';
      var meta = DISH_INDEX[k];
      if (meta && meta.item.options) {
        opt = '<select class="opt-select">' + meta.item.options.map(function (o) {
          return '<option' + (o === d.option ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
      }
      return '<div class="cart-item" data-name="' + esc(k) + '">' +
        '<div class="ci-name">' + esc(k) + opt + '</div>' +
        '<div class="stepper">' +
        '<button class="step-btn" data-act="minus">−</button>' +
        '<span class="step-num">' + d.qty + '</span>' +
        '<button class="step-btn" data-act="plus">＋</button>' +
        '</div></div>';
    }).join('');
  }

  $('cartList').addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.step-btn') : null;
    if (!btn) return;
    var row = btn.closest('.cart-item');
    var k = row.getAttribute('data-name');
    if (!cart[k]) return;
    if (btn.getAttribute('data-act') === 'plus') cart[k].qty++;
    else {
      cart[k].qty--;
      if (cart[k].qty <= 0) delete cart[k];
    }
    renderCart();
    updateBadges();
    updateBar();
  });

  $('cartList').addEventListener('change', function (ev) {
    if (!ev.target.classList || !ev.target.classList.contains('opt-select')) return;
    var row = ev.target.closest('.cart-item');
    var k = row.getAttribute('data-name');
    if (cart[k]) cart[k].option = ev.target.value;
  });

  $('btnClear').addEventListener('click', function () {
    cart = {};
    renderCart();
    updateBadges();
    updateBar();
    toast('已清空，重新点');
  });

  /* ---------- 生成点菜单 ---------- */
  $('btnGen').addEventListener('click', function () {
    var keys = Object.keys(cart);
    if (!keys.length) { toast('还没点菜呢，先去菜单里点几道'); return; }
    var name = $('fName').value.trim();
    if (!name) { toast('请填个昵称，主人才记得住你的口味'); $('fName').focus(); return; }

    var dishes = keys.map(function (k) { return cart[k]; });
    dishes.sort(function (a, b) {
      return secOrder.indexOf(a.section) - secOrder.indexOf(b.section);
    });

    var order = {
      name: name,
      dateText: XZ.fmtDateTime(new Date()),
      restrictions: $('fRestr').value.trim(),
      prefs: prefs.slice(),
      note: $('fNote').value.trim(),
      dishes: dishes
    };

    /* 存历史（仅本机） */
    var his = lsGet('xz_orders', []);
    his.unshift({ ts: Date.now(), dateText: order.dateText, name: name, restrictions: order.restrictions,
      prefs: order.prefs, note: order.note, dishes: dishes });
    if (his.length > 50) his.length = 50;
    lsSet('xz_orders', his);
    lsSet('xz_name', name);

    cardText = XZ.formatCard(order);
    $('copySource').value = cardText;
    $('copySource').classList.remove('show');
    drawCard(order, function (url) {
      $('cardImg').src = url;
      openSheet('sheetResult');
    });
  });

  $('btnBackEdit').addEventListener('click', function () {
    closeSheet('sheetResult');
    renderCart();
    openSheet('sheetOrder');
  });

  /* ---------- 复制 ---------- */
  $('btnCopy').addEventListener('click', function () {
    copyText(cardText);
  });

  function copyText(t) {
    function fallback() {
      var ta = $('copySource');
      ta.value = t;
      ta.classList.add('show');
      ta.focus();
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      if (ok) {
        toast('已复制，去微信粘贴给主人吧');
        setTimeout(function () { ta.classList.remove('show'); }, 2000);
      } else {
        toast('自动复制失败，请长按上方文字全选复制');
      }
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t).then(
        function () { toast('已复制，去微信粘贴给主人吧'); },
        fallback
      );
    } else fallback();
  }

  /* ---------- 历史记录 ---------- */
  function renderHistory() {
    var his = lsGet('xz_orders', []);
    var box = $('historyList');
    if (!his.length) {
      box.innerHTML = '<div class="empty-tip">还没有点单记录<br>点完菜生成菜单卡后，这里会帮你记住</div>';
      return;
    }
    box.innerHTML = his.map(function (o, i) {
      var names = o.dishes.map(function (d) { return d.name; }).join('、');
      var meta = [];
      if (o.restrictions) meta.push('忌口：' + esc(o.restrictions));
      if (o.prefs && o.prefs.length) meta.push('口味：' + esc(o.prefs.join('、')));
      return '<div class="history-item">' +
        '<div class="hi-date">' + esc(o.dateText) + '</div>' +
        '<div class="hi-dishes">' + esc(names) + '</div>' +
        (meta.length ? '<div class="hi-meta">' + meta.join(' ｜ ') + '</div>' : '') +
        '<button class="hi-btn" data-i="' + i + '">再来一单</button>' +
        '</div>';
    }).join('');
  }

  $('historyList').addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.hi-btn') : null;
    if (!btn) return;
    var his = lsGet('xz_orders', []);
    var o = his[parseInt(btn.getAttribute('data-i'), 10)];
    if (!o) return;
    cart = {};
    o.dishes.forEach(function (d) {
      cart[d.name] = { name: d.name, section: d.section, option: d.option || '', qty: d.qty };
    });
    prefs = (o.prefs || []).slice();
    $('fName').value = o.name || '';
    $('fRestr').value = o.restrictions || '';
    $('fNote').value = o.note || '';
    renderPrefs();
    updateBadges();
    updateBar();
    closeSheet('sheetHistory');
    renderCart();
    openSheet('sheetOrder');
    toast('已载入上次点单，可调整后再生成');
  });

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* ============================================================
     画点菜单卡（长按可保存/转发的图片）
     ============================================================ */
  function drawCard(order, cb) {
    var W = 750, MAXH = 2400;
    var tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = MAXH;
    var x = tmp.getContext('2d');

    var INK = '#2A241C', MUT = '#8D8172', GOLD = '#A8894F', ACC = '#8C2F1B', LINE = '#D9CFBB';

    function serif(px, w) {
      return (w ? w + ' ' : '') + px + 'px "Songti SC","STSong","Noto Serif SC","Source Han Serif SC",Georgia,serif';
    }
    function sans(px) {
      return px + 'px -apple-system,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif';
    }
    function spacing(v) { try { x.letterSpacing = v; } catch (e) {} }
    function hairline(y) {
      x.strokeStyle = LINE; x.lineWidth = 1;
      x.beginPath(); x.moveTo(88, y); x.lineTo(W - 88, y); x.stroke();
    }
    function ornament(y) {
      x.strokeStyle = LINE; x.lineWidth = 1;
      x.beginPath(); x.moveTo(W / 2 - 110, y); x.lineTo(W / 2 - 16, y); x.stroke();
      x.beginPath(); x.moveTo(W / 2 + 16, y); x.lineTo(W / 2 + 110, y); x.stroke();
      x.save();
      x.translate(W / 2, y); x.rotate(Math.PI / 4);
      x.fillStyle = GOLD; x.fillRect(-4, -4, 8, 8);
      x.restore();
    }
    function wrap(text, font, maxW) {
      x.font = font;
      var lines = [], line = '';
      for (var i = 0; i < text.length; i++) {
        var test = line + text[i];
        if (x.measureText(test).width > maxW && line) {
          // 优先在顿号/逗号处断行，避免把词拆到两行
          var cut = -1;
          for (var j = line.length - 1; j >= 0 && j >= line.length - 8; j--) {
            if ('、，,；; '.indexOf(line[j]) >= 0) { cut = j + 1; break; }
          }
          if (cut > 0 && cut < line.length) {
            lines.push(line.slice(0, cut));
            line = line.slice(cut) + text[i];
          } else {
            lines.push(line);
            line = text[i];
          }
        } else line = test;
      }
      if (line) lines.push(line);
      return lines;
    }

    x.fillStyle = '#FAF6EC';
    x.fillRect(0, 0, W, MAXH);

    var y = 116;
    x.textAlign = 'center';
    x.fillStyle = INK; x.font = serif(52, 'bold');
    spacing('10px');
    x.fillText(MENU.restaurant.split('').join(' '), W / 2, y);
    spacing('0px');
    y += 50;

    x.font = sans(21); x.fillStyle = GOLD;
    spacing('7px');
    x.fillText(MENU.english, W / 2, y);
    spacing('0px');
    y += 42;
    ornament(y);

    y += 58;
    x.font = sans(19); x.fillStyle = GOLD;
    spacing('6px');
    x.fillText('GUEST ORDER', W / 2, y);
    spacing('0px');

    y += 62;
    x.fillStyle = INK; x.font = serif(40, 'bold');
    x.fillText(order.name, W / 2, y);

    y += 42;
    x.font = sans(22); x.fillStyle = MUT;
    x.fillText(order.dateText, W / 2, y);

    y += 44;
    hairline(y);

    /* 菜品（按菜单分节顺序） */
    var bySec = {};
    order.dishes.forEach(function (d) {
      (bySec[d.section] = bySec[d.section] || []).push(d);
    });
    var secEn = {};
    MENU.sections.forEach(function (s) { secEn[s.label] = s.en; });

    secOrder.forEach(function (label) {
      var list = bySec[label];
      if (!list) return;
      y += 66;
      x.textAlign = 'center';
      x.font = sans(20); x.fillStyle = GOLD;
      spacing('5px');
      x.fillText((label + ' · ' + (secEn[label] || '')).toUpperCase(), W / 2, y);
      spacing('0px');

      list.forEach(function (d) {
        var line = d.name + (d.option ? '（' + d.option + '）' : '');
        var lines = wrap(line, serif(30), 430);
        y += 48;
        x.textAlign = 'left';
        x.fillStyle = INK; x.font = serif(30);
        x.fillText(lines[0], 104, y);
        x.textAlign = 'right';
        x.fillStyle = ACC; x.font = sans(26);
        x.fillText('×' + d.qty, W - 104, y);
        for (var i = 1; i < lines.length; i++) {
          y += 42;
          x.textAlign = 'left';
          x.fillStyle = INK; x.font = serif(30);
          x.fillText(lines[i], 104, y);
        }
        y += 14;
      });
    });

    y += 26;
    hairline(y);

    /* 忌口 / 口味 / 备注 */
    var infos = [];
    if (order.restrictions) infos.push(['忌口', order.restrictions]);
    if (order.prefs && order.prefs.length) infos.push(['口味', order.prefs.join('、')]);
    if (order.note) infos.push(['备注', order.note]);

    infos.forEach(function (it) {
      // 值从 x=232 起，右侧留白到 646（内画框 36px 再内收），换行宽度 400
      var lines = wrap(it[1], serif(26), 400);
      y += 52;
      x.textAlign = 'left';
      x.font = sans(22); x.fillStyle = MUT;
      x.fillText(it[0], 104, y);
      x.fillStyle = INK; x.font = serif(26);
      x.fillText(lines[0], 232, y);
      for (var i = 1; i < lines.length; i++) {
        y += 40;
        x.fillText(lines[i], 232, y);
      }
    });

    y += 62;
    x.textAlign = 'center';
    x.fillStyle = MUT; x.font = serif(26);
    x.fillText(MENU.restaurant + ' · ' + MENU.subtitle, W / 2, y);
    y += 38;
    x.font = sans(18); x.fillStyle = GOLD;
    spacing('4px');
    x.fillText(MENU.season, W / 2, y);
    spacing('0px');

    var finalH = Math.min(y + 36, MAXH);

    /* 裁剪 + 双线画框 */
    var out = document.createElement('canvas');
    out.width = W; out.height = finalH;
    var o = out.getContext('2d');
    o.fillStyle = '#FAF6EC';
    o.fillRect(0, 0, W, finalH);
    o.drawImage(tmp, 0, 0, W, finalH, 0, 0, W, finalH);
    o.strokeStyle = '#B9A87F'; o.lineWidth = 2;
    o.strokeRect(26, 26, W - 52, finalH - 52);
    o.lineWidth = 1;
    o.strokeRect(36, 36, W - 72, finalH - 72);

    cb(out.toDataURL('image/png'));
  }

  /* ---------- 初始化 ---------- */
  updateBar();
  var savedName = lsGet('xz_name', '');
  if (savedName) $('fName').value = savedName;

})();
