/* ============================================================
   SMA Link Actions — Owner Version
   Hosted at: https://wildref.us/tools/smalink.js
   Bookmarklet: javascript:(function(){var s=document.createElement('script');s.src='https://wildref.us/tools/smalink.js?_='+Date.now();document.head.appendChild(s);})();
   ============================================================ */

window.smalinkActions = function () {
    try {

        /* ── Ensure mobile viewport is set (some SMA pages omit this) ── */
        (function () {
            var vm = document.querySelector("meta[name=viewport]");
            if (!vm) {
                vm = document.createElement("meta");
                vm.name = "viewport";
                document.head.appendChild(vm);
            }
            if ((vm.content || "").indexOf("width=device-width") === -1) {
                vm.content = "width=device-width, initial-scale=1, maximum-scale=1";
            }
        })();

        /* ============================================================
           CONFIG  —  edit this block only
        ============================================================ */
        var CFG = {
            version:  "9.1",
            buyerMap: {
                "Eli Lee": "elijah.lee@smalink.com"
                /* add more exceptions here:
                   "First Last": "custom@smalink.com"  */
            }
        };

        /* ============================================================
           PAGE DETECTION
        ============================================================ */
        var PAGE = (function () {
            var u = location.href.toLowerCase();
            return {
                isOrder:      u.indexOf("orderdetails.aspx")     > -1,
                isInvoice:    u.indexOf("invoicedetails.aspx")   > -1,
                isItem:       u.indexOf("itemlookup.aspx")       > -1,
                isItemDetail: u.indexOf("itemdetail.aspx")       > -1,
                isRemote:     u.indexOf("remoteorderform.aspx")  > -1,
                isLiterature: u.indexOf("smalink.com/documents") > -1,
                isNewsletterProduct: u.indexOf("smalink.com") > -1 &&
                                     u.indexOf("wc.smalink") === -1,
                isSalesRep:   u.indexOf("salesreps")             > -1,
                isCRM:        u.indexOf("crm.smalink.net")        > -1
            };
        })();

        /* ============================================================
           UTILITY
        ============================================================ */

        function money(s) {
            s = String(s || "").replace(/[^0-9.\-]/g, "");
            var n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        }

        function pN(s) {
            return parseFloat(String(s).replace(/[^0-9.-]+/g, "")) || 0;
        }

        function txt(el) {
            return el ? (el.innerText || el.textContent || "").trim() : "";
        }

        function qs(sel, root) {
            return (root || document).querySelector(sel);
        }

        function qsa(sel, root) {
            return Array.prototype.slice.call((root || document).querySelectorAll(sel));
        }

        function el(tag, cssText, extra) {
            var e = document.createElement(tag);
            if (cssText) e.style.cssText = cssText;
            if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
            return e;
        }

        /* ============================================================
           SHARED STYLES  (mobile-first, 44px tap targets)
        ============================================================ */
        var S = {
            overlay:  "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999990",
            panel:    "position:fixed;top:6%;left:50%;transform:translateX(-50%);" +
                      "width:92%;max-width:390px;" +
                      "max-height:calc(88vh - env(safe-area-inset-bottom,20px));" +
                      "background:#fff;border:2px solid #333;border-radius:14px;" +
                      "z-index:999999;display:flex;flex-direction:column;overflow:hidden;" +
                      "box-shadow:0 8px 32px rgba(0,0,0,.28)",
            hdr:      "background:#1a1a2e;color:#fff;padding:12px 14px;" +
                      "font-size:15px;font-weight:700;text-align:center;flex-shrink:0;" +
                      "letter-spacing:.3px",
            scroll:   "overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1;padding:10px",
            foot:     "padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px)) 10px;" +
                      "border-top:1px solid #e0e0e0;background:#fafafa;" +
                      "flex-shrink:0;display:flex;gap:6px;flex-wrap:wrap",
            btn:      "flex:1 1 auto;min-height:44px;padding:9px 10px;font-size:14px;" +
                      "font-weight:600;border:1.5px solid #bbb;border-radius:10px;" +
                      "background:#fff;cursor:pointer;transition:background .15s",
            btnPri:   "flex:1 1 auto;min-height:44px;padding:9px 10px;font-size:14px;" +
                      "font-weight:700;border:none;border-radius:10px;background:#1a1a2e;" +
                      "color:#fff;cursor:pointer;transition:background .15s",
            btnDanger:"flex:1 1 auto;min-height:44px;padding:9px 10px;font-size:14px;" +
                      "font-weight:700;border:none;border-radius:10px;background:#c0392b;" +
                      "color:#fff;cursor:pointer",
            row:      "margin-bottom:8px;padding:10px 12px;border-radius:11px;" +
                      "display:flex;align-items:flex-start;gap:10px;font-size:14px",
            sep:      "font-size:10px;font-weight:700;letter-spacing:1.2px;color:#888;" +
                      "text-transform:uppercase;padding:4px 0 2px 2px;margin-top:6px"
        };

        /* ============================================================
           META EXTRACTION  (order details page)
        ============================================================ */
        function meta() {
            var acct = "", name = "", ord = "", od = "";
            var e = qs("#ctl00_cp1_DetailsView1_lblShip2Name");
            if (e) {
                var t = txt(e).split(" - ");
                acct = (t[0] || "").trim();
                name = t.slice(1).join(" - ").trim();
            }
            var i = qs("#ctl00_cp1_op1_txtOrderNo");
            if (i) ord = (i.value || "").trim();
            qsa("#ctl00_cp1_DetailsView4 tr").forEach(function (r) {
                var k = r.cells && r.cells[0] ? txt(r.cells[0]) : "";
                if (k === "Order Date") od = r.cells[1] ? txt(r.cells[1]) : "";
            });
            return { acct: acct, name: name, ord: ord, od: od };
        }

        /* ============================================================
           ITEM EXTRACTION
        ============================================================ */
        function st(r) {
            var s = r.querySelector("td.hidden-phone");
            return s ? txt(s) : "";
        }

        function qty(r) {
            var q = r.querySelector("div.visible-phone small");
            if (q && q.textContent.indexOf("Qty") > -1)
                return q.textContent.replace(/[^\d.]/g, "").replace(/\.0+$/, "");
            var t = r.querySelector("td:nth-child(3)");
            return t ? txt(t).replace(/[^\d.]/g, "").replace(/\.0+$/, "") : "";
        }

        function items() {
            var a = [];
            qsa("#ctl00_cp1_gvSalesOrderLines tr").forEach(function (r) {
                var p = r.querySelector("span[id*='lblItemId'] b"),
                    d = r.querySelector("span[id*='lblItemDescription']");
                if (!p) return;
                var s = (st(r) || "").trim();
                a.push({
                    pn:  txt(p),
                    sd:  (d ? txt(d) : "").substring(0, 30),
                    qt:  qty(r),
                    bo:  (s === "B" || s === "D" || s === "S"),
                    ds:  s,
                    row: r
                });
            });
            a.sort(function (x, y) {
                return x.pn.localeCompare(y.pn, undefined, { numeric: true });
            });
            return a;
        }

        /* ============================================================
           EMAIL COMPOSER
           iOS/Mac  → ms-outlook://  (opens Outlook directly)
           Android/other → mailto:   (opens default mail app)
        ============================================================ */
        var isApple = /ipad|iphone|ipod|macintosh/i.test(navigator.userAgent) &&
                      !window.MSStream;

        function compose(to, subject, body) {
            var p = [];
            if (to)      p.push("to="      + encodeURIComponent(to));
            if (subject) p.push("subject=" + encodeURIComponent(subject));
            if (body)    p.push("body="    + encodeURIComponent(body));
            var qs = p.join("&");
            location.href = isApple
                ? "ms-outlook://compose?" + qs
                : "mailto:?" + qs;
        }

        /* ============================================================
           OVERLAY HELPER
           Full-screen overlay contains the card so the footer is always
           above Safari's bottom toolbar on iPhone/iPad.
           Returns { panel, close }. Callers append a scroll div then
           call panel.sealFooter(el) to pin the footer at the bottom.
        ============================================================ */
        function makePanel(title, onClose) {
            /* full-screen backdrop */
            var ov = el("div",
                "position:fixed;inset:0;z-index:999999;" +
                "background:rgba(0,0,0,.48);" +
                "display:flex;flex-direction:column;" +
                "align-items:center;justify-content:center;" +
                "padding:env(safe-area-inset-top,12px) 0 " +
                       "env(safe-area-inset-bottom,12px) 0");

            /* card — safe-area aware so footer never hides behind Safari toolbar */
            var pan = el("div",
                "display:flex;flex-direction:column;" +
                "width:92%;max-width:390px;" +
                "max-height:calc(100vh - env(safe-area-inset-top,12px) - env(safe-area-inset-bottom,12px) - 24px);" +
                "background:#fff;" +
                "border:2px solid #333;border-radius:14px;overflow:hidden;" +
                "box-shadow:0 8px 32px rgba(0,0,0,.30)");

            var hdr = el("div", S.hdr);
            hdr.textContent = title;
            pan.appendChild(hdr);

            function close() {
                if (ov.parentNode) ov.parentNode.removeChild(ov);
                if (onClose) onClose();
            }

            ov.addEventListener("click", function (e) {
                if (e.target === ov) close();
            });

            pan.sealFooter = function (footEl) {
                footEl.style.flexShrink = "0";
                pan.appendChild(footEl);
            };

            ov.appendChild(pan);
            document.body.appendChild(ov);
            return { panel: pan, close: close };
        }

        /* ============================================================
           PART NUMBER LOOKUP
        ============================================================ */
        function pnLookup(pn) {
            try {
                window.open(
                    "https://wc.smalink.net/common/inventory/itemlookup.aspx?searchstring=" +
                    encodeURIComponent(pn), "_blank"
                );
            } catch (e) {}
        }

        /* ============================================================
           STATUS TSV  (for clipboard copy)
        ============================================================ */
        function statusTSV(it) {
            var m = meta(), out = [];
            it.forEach(function (i) {
                if (!i.ds) return;
                var td   = i.row.querySelectorAll("td");
                var cost = td[4] ? money(txt(td[4])) : 0;
                var ext  = td[5] ? money(txt(td[5])) : 0;
                var q    = parseFloat(String(i.qt || "").replace(/[^0-9.]/g, "")) || 0;
                if (!ext && cost && q) ext = +(cost * q).toFixed(2);
                out.push([
                    m.od, m.ord, m.name, m.acct,
                    i.ds, i.pn, i.sd, i.qt,
                    cost ? cost.toFixed(2) : "",
                    ext  ? ext.toFixed(2)  : ""
                ].join("\t"));
            });
            return out.join("\n");
        }

        /* ============================================================
           CSV EXPORT  (iOS-safe)
        ============================================================ */
        function orderToCSV() {
            var rows = qsa(
                "#ctl00_cp1_gvSalesOrderLines tr.gridrow," +
                "#ctl00_cp1_gvSalesOrderLines tr.altgridrow"
            );
            if (!rows.length) { alert("No items found."); return; }

            function g(t) { return '"' + String(t || "").replace(/"/g, '""') + '"'; }

            var csv = ["Item Number","Short Description","Long Description","Disposition",
                "Qty Ordered","UOM","Unit Price","Extended Price","Qty Allocated",
                "Qty on Pick-Tickets","Qty Invoiced","Complete","Open $","Net Weight"
            ].join(",") + "\n";

            rows.forEach(function (r) {
                var c   = r.querySelectorAll("td"), ic = c[0];
                if (!ic) return;
                var num = ic.querySelector("span b")                         ? txt(ic.querySelector("span b"))                         : "";
                var sd  = ic.querySelector("span[id*='lblItemDescription']") ? txt(ic.querySelector("span[id*='lblItemDescription']")) : "";
                var ld  = ic.querySelector("small")                          ? txt(ic.querySelector("small"))                          : "";
                var comp = c[9] && c[9].querySelector("i.fa-check-square") ? "Yes" : "No";
                csv += [
                    num, sd, ld,
                    c[1]  ? txt(c[1])                              : "",
                    c[2]  ? txt(c[2]).replace(/\.000$/, "")        : "",
                    c[3]  ? txt(c[3])                              : "",
                    c[4]  ? txt(c[4]).replace(/^\$/, "")           : "",
                    c[5]  ? txt(c[5]).replace(/^\$/, "")           : "",
                    c[6]  ? txt(c[6]).replace(/\.000$/, "")        : "",
                    c[7]  ? txt(c[7]).replace(/\.000$/, "")        : "",
                    c[8]  ? txt(c[8]).replace(/\.000$/, "")        : "",
                    comp,
                    c[10] ? txt(c[10]).replace(/^\$/, "")          : "",
                    c[11] ? txt(c[11])                             : ""
                ].map(g).join(",") + "\n";
            });

            /* iOS-safe: open blob in new tab instead of <a>.click() */
            var blob = new Blob([csv], { type: "text/csv" });
            var url  = URL.createObjectURL(blob);
            var isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);
            if (isIOS) {
                window.open(url, "_blank");
            } else {
                var a = el("a");
                a.href = url;
                a.download = "order_lines.csv";
                a.click();
            }
            setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
        }

        /* ============================================================
           CLIPBOARD HELPER  (iOS-safe fallback)
        ============================================================ */
        function copyText(text, onOk, onFail) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(onOk, onFail || function () {
                    fallbackCopy(text, onOk, onFail);
                });
            } else {
                fallbackCopy(text, onOk, onFail);
            }
        }

        function fallbackCopy(text, onOk, onFail) {
            var ta = el("textarea",
                "position:fixed;top:-9999px;left:-9999px;opacity:0");
            ta.value = text;
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand("copy");
                if (onOk) onOk();
            } catch (e) {
                if (onFail) onFail();
                else alert("Copy failed — please copy manually.");
            }
            document.body.removeChild(ta);
        }

        /* ============================================================
           ITEM PICKER  — 3-mode: Order / RMA / ETA
        ============================================================ */
        function picker(it, title, done) {
            var p   = makePanel(title);
            var pan = p.panel;

            /* current mode: "order" | "rma" | "eta" */
            var curMode = "order";

            /* ── Segmented 3-way toggle ── */
            var segWrap = el("div",
                "padding:8px 10px;border-bottom:1px solid #e0e0e0;background:#f5f5f8;" +
                "flex-shrink:0;display:flex;gap:0;border-radius:0");

            var MODES = [
                { key: "order",    label: "Order"    },
                { key: "rma",      label: "RMA"      },
                { key: "eta",      label: "ETA"      },
                { key: "tech",     label: "Tech"     },
                { key: "tracking", label: "Tracking" }
            ];

            var segBtns = {};
            MODES.forEach(function (m, idx) {
                var last = idx === MODES.length - 1;
                var b = el("button",
                    "flex:1;min-height:36px;font-size:13px;font-weight:700;" +
                    "border:1.5px solid #1a1a2e;cursor:pointer;transition:background .12s;" +
                    "border-radius:" +
                        (idx === 0 ? "8px 0 0 8px" : last ? "0 8px 8px 0" : "0") +
                    ";margin-left:" + (idx === 0 ? "0" : "-1.5px"));
                b.textContent = m.label;
                segBtns[m.key] = b;
                b.addEventListener("click", function () { setMode(m.key); });
                segWrap.appendChild(b);
            });

            function setMode(mode) {
                curMode = mode;
                MODES.forEach(function (m) {
                    var b = segBtns[m.key];
                    if (m.key === mode) {
                        b.style.background = "#1a1a2e";
                        b.style.color      = "#fff";
                    } else {
                        b.style.background = "#fff";
                        b.style.color      = "#1a1a2e";
                    }
                });
                /* show/hide RMA dropdowns & qty inputs based on mode */
                qsa("input[type=checkbox]", list).forEach(function (c) {
                    if (!c._sel || !c._qtyIn) return;
                    if (mode === "rma" && c.checked) {
                        c._sel.style.display   = "block";
                        c._qtyIn.style.display = "inline-block";
                    } else {
                        c._sel.style.display   = "none";
                        c._qtyIn.style.display = "none";
                        c._sel.value = "";
                    }
                });
                /* update hint text */
                hint.textContent =
                    mode === "rma"      ? "Check items to return — select a reason for each"  :
                    mode === "eta"      ? "Check items needing an ETA — one email per part"   :
                    mode === "tech"     ? "Check items needing Tech Help — one email per part" :
                    mode === "tracking" ? "Loading shipment info from Pick-Tickets tab…"       :
                                          "Check items to include in the order email";
                /* update primary button label */
                if (mode === "tracking") {
                    bOk.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;' +
                        'width:18px;height:18px;background:#25d366;border-radius:4px;' +
                        'font-size:12px;line-height:1;margin-right:5px;">💬</span>Text To';
                } else {
                    bOk.textContent =
                        mode === "rma"  ? "📦  Create RMA Email"       :
                        mode === "eta"  ? "⏱  Send ETA Request(s)"     :
                        mode === "tech" ? "🔧  Send Tech Help Email"    :
                                          "📋  Create Order Email";
                }
                /* show/hide tracking panel + copy button */
                if (mode === "tracking") {
                    list.style.display     = "none";
                    bCopy.style.display    = "";
                    bOutlook.style.display = "";
                    if (!trackingDiv) { buildTrackingPanel(); }
                    trackingDiv.style.display = "";
                } else {
                    list.style.display     = "";
                    bCopy.style.display    = "none";
                    bOutlook.style.display = "none";
                    if (trackingDiv) trackingDiv.style.display = "none";
                }
            }

            pan.appendChild(segWrap);

            /* ── Hint line ── */
            var hint = el("div",
                "padding:5px 12px;font-size:11px;color:#777;background:#fafafa;" +
                "border-bottom:1px solid #ebebeb;flex-shrink:0");
            pan.appendChild(hint);

            /* ── Scrollable list ── */
            var list = el("div", S.scroll);
            pan.appendChild(list);

            /* ── Tracking panel (lazy-built when tab selected) ── */
            var trackingDiv = null;

            function buildTrackingPanel() {
                trackingDiv = el("div", S.scroll + ";padding:10px 12px");
                pan.insertBefore(trackingDiv, list.nextSibling);

                /* carrier → tracking URL */
                var CARRIERS = [
                    { key:"UPS",          fn:function(n){ return "https://www.ups.com/track?tracknum="+n; }},
                    { key:"FEDEX FREIGHT",fn:function(n){ return "https://www.fedexfreight.com/fedextrack/?trknbr="+n+"&trkqual=~"+n+"~FDFR"; }},
                    { key:"FEDEX",        fn:function(n){ return "https://www.fedex.com/fedextrack/?trknbr="+n; }},
                    { key:"USPS",         fn:function(n){ return "https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1="+n; }},
                    { key:"SOUTHEASTERN", fn:function(n){ return "https://www.sefl.com/webconnect/tracing?Type=PN&RefNum1="+n; }},
                    { key:"SEFL",         fn:function(n){ return "https://www.sefl.com/webconnect/tracing?Type=PN&RefNum1="+n; }},
                    { key:"ESTES",        fn:function(n){ return "https://www.estesexpress.com/myestes/tracking?pro="+n; }},
                    { key:"AVERITT",      fn:function(n){ return "https://www.averittexpress.com/trk.action?type=P&id="+n; }},
                    { key:"SAIA",         fn:function(n){ return "https://www.saia.com/track/details;pro="+n; }},
                    { key:"OLD DOMINION", fn:function(n){ return "https://www.odfl.com/Trace/TraceAction.do?pro="+n; }},
                    { key:"ODW",          fn:function(n){ return "https://www.odfl.com/Trace/TraceAction.do?pro="+n; }},
                    { key:"DAYTON",       fn:function(n){ return "https://tools.daytonfreight.com/tracking/detail/"+n; }},
                    { key:"AAA COOPER",   fn:function(n){ return "https://www.aaacooper.com/Transit/ProTrackResults.aspx?ProNum="+n; }},
                    { key:"AAA-COOPER",   fn:function(n){ return "https://www.aaacooper.com/Transit/ProTrackResults.aspx?ProNum="+n; }},
                    { key:"AAACOOPER",    fn:function(n){ return "https://www.aaacooper.com/Transit/ProTrackResults.aspx?ProNum="+n; }},
                    { key:"XPO",          fn:function(n){ return "https://ext-web.ltl-xpo.com/public-app/shipments?referenceNumber="+n; }},
                    { key:"CONWAY",       fn:function(n){ return "https://ext-web.ltl-xpo.com/public-app/shipments?referenceNumber="+n; }},
                    { key:"N&M",          fn:function(n){ return "https://www.nmtransfer.com/quickTrack?pro="+n; }},
                    { key:"N & M",        fn:function(n){ return "https://www.nmtransfer.com/quickTrack?pro="+n; }},
                    { key:"NMTRANSFER",   fn:function(n){ return "https://www.nmtransfer.com/quickTrack?pro="+n; }},
                    { key:"SPEE-DEE",     fn:function(n){ return "https://speedeedelivery.com/track-a-shipment/?trackingNumber="+n; }},
                    { key:"SPEEDEE",      fn:function(n){ return "https://speedeedelivery.com/track-a-shipment/?trackingNumber="+n; }},
                    { key:"SPEED-DEE",    fn:function(n){ return "https://speedeedelivery.com/track-a-shipment/?trackingNumber="+n; }}
                ];

                function getTrackUrl(carrier, num) {
                    var cu = (carrier||"").toUpperCase();
                    for (var i=0;i<CARRIERS.length;i++) {
                        if (cu.indexOf(CARRIERS[i].key)>-1) return CARRIERS[i].fn(num);
                    }
                    return null;
                }

                function renderShipments() {
                    trackingDiv.innerHTML = "";
                    var m    = meta();
                    var rows = qsa("#ctl00_cp1_gvwShipments tr.gridrow, #ctl00_cp1_gvwShipments tr.altgridrow");

                    if (!rows.length) {
                        var msg = el("div","padding:20px;text-align:center;font-size:13px;color:#888");
                        msg.textContent = "No shipments found. Make sure the Pick-Tickets tab has loaded.";
                        trackingDiv.appendChild(msg);
                        return;
                    }

                    var textLines = [];
                    if (m.ord)  textLines.push("Order #"+m.ord);
                    if (m.name) textLines.push(m.name);
                    textLines.push("");

                    rows.forEach(function(r) {
                        var c = r.querySelectorAll("td");
                        if (c.length<6) return;
                        var tracking = txt(c[3]).trim();
                        var carrier  = txt(c[5]).trim();
                        var inv      = txt(c[1]).trim();
                        var date     = txt(c[2]).trim();
                        var direct   = txt(c[4]).trim();
                        var url      = tracking ? getTrackUrl(carrier,tracking) : null;

                        var card = el("div","border:1.5px solid #dde;border-radius:12px;padding:12px;margin-bottom:10px;background:#fafafa");

                        /* carrier row */
                        var cRow = el("div","font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap");
                        var cName = el("span"); cName.textContent = "🚛  "+(carrier||"Unknown Carrier");
                        cRow.appendChild(cName);
                        if (direct==="Y") {
                            var db=el("span","font-size:10px;font-weight:700;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:20px;border:1px solid #a5d6a7");
                            db.textContent="DIRECT"; cRow.appendChild(db);
                        }
                        card.appendChild(cRow);

                        /* tracking number */
                        if (tracking) {
                            if (url) {
                                var a=el("a","font-size:15px;font-weight:700;color:#1565c0;text-decoration:underline;word-break:break-all;display:block;margin-bottom:4px");
                                a.textContent=tracking; a.href=url; a.target="_blank";
                                card.appendChild(a);
                                textLines.push(carrier+": "+tracking);
                                textLines.push(url);
                            } else {
                                var sp=el("span","font-size:15px;font-weight:700;color:#333;word-break:break-all;display:block;margin-bottom:2px;user-select:all");
                                sp.textContent=tracking; card.appendChild(sp);
                                var note=el("div","font-size:11px;color:#999;margin-bottom:4px");
                                note.textContent="Tap and hold to copy"; card.appendChild(note);
                                textLines.push(carrier+": "+tracking);
                            }
                            textLines.push("");
                        } else {
                            var noTrk=el("div","font-size:13px;color:#999;margin-bottom:4px");
                            noTrk.textContent="No tracking number yet"; card.appendChild(noTrk);
                            textLines.push(carrier+": (no tracking #)");
                        }

                        /* meta */
                        var meta2=el("div","font-size:12px;color:#888");
                        meta2.textContent=(inv?"Invoice #"+inv+"  ":"")+(date?"· "+date:"");
                        card.appendChild(meta2);

                        trackingDiv.appendChild(card);
                    });

                    /* store textLines for the Text button */
                    trackingDiv._textLines = textLines;
                }

                /* Click the Pick-Tickets tab to trigger load, then render */
                var ptTab = qs("a[href='#picktickets']");
                if (ptTab) {
                    ptTab.click();
                    /* Give the page a moment to load the tab content */
                    setTimeout(renderShipments, 800);
                } else {
                    renderShipments();
                }
            }

            /* ── Footer ── */
            var foot = el("div",
                "padding:8px 10px;border-top:1px solid #e0e0e0;background:#fafafa;" +
                "flex-shrink:0;display:flex;flex-direction:column;gap:6px");

            var footRow1 = el("div", "display:flex;gap:6px");
            var bAll  = el("button", S.btn); bAll.textContent  = "All / None";
            var bStat = el("button", S.btn); bStat.textContent = "Copy Status";
            var bCsv  = el("button", S.btn); bCsv.textContent  = "Export CSV";
            [bAll, bStat, bCsv].forEach(function (b) { footRow1.appendChild(b); });

            var footRow2 = el("div", "display:flex;gap:4px");
            var bOk  = el("button", S.btnPri); bOk.textContent  = "Create Email";
            var bCopy= el("button", S.btn);    bCopy.textContent= "📋 Copy";
            var bOutlook = el("button", S.btn); bOutlook.textContent = "🔍 Mail";
            var bCa  = el("button", S.btnDanger); bCa.textContent = "Cancel";
            bCopy.style.display    = "none"; /* only visible in tracking mode */
            bOutlook.style.display = "none"; /* only visible in tracking mode */
            /* compact style so all 4 fit on one row */
            [bOk, bCopy, bOutlook, bCa].forEach(function (b) {
                b.style.fontSize  = "12px";
                b.style.padding   = "5px 4px";
                b.style.minHeight = "32px";
                b.style.flex      = "1 1 0";
                b.style.minWidth  = "0";
                footRow2.appendChild(b);
            });

            foot.appendChild(footRow1);
            foot.appendChild(footRow2);
            pan.sealFooter(foot);

            /* wire copy button */
            bCopy.addEventListener("click", function() {
                var lines = (trackingDiv && trackingDiv._textLines) || [];
                if (!lines.length) { alert("No tracking info loaded yet."); return; }
                copyText(lines.join("\n").trim(), function() {
                    bCopy.textContent = "✓ Copied!";
                    setTimeout(function(){ bCopy.textContent = "📋 Copy"; }, 2000);
                });
            });

            /* wire outlook button */
            bOutlook.addEventListener("click", function () {
                var m2 = meta();
                var q  = m2.ord || "";
                if (!q) { alert("No order number found."); return; }
                copyText(q, function () {
                    alert("Order number copied!\nPaste to search in Outlook.");
                    location.href = "ms-outlook://search";
                }, function () {
                    alert("Order number copied!\nPaste to search in Outlook.");
                    location.href = "ms-outlook://search";
                });
            });

            /* ── Build item rows ── */
            function buildList() {
                list.innerHTML = "";
                it.forEach(function (i) {
                    var rowBg  = i.bo ? "#ffe5e5" : i.ds === "C" ? "#fff8dc" : "#fafafa";
                    var rowBdr = i.bo ? "#cc0000" : i.ds === "C" ? "#d4a017" : "#ddd";

                    var row = el("div",
                        S.row + ";background:" + rowBg + ";border:1.5px solid " + rowBdr);

                    var cb = el("input",
                        "width:20px;height:20px;flex:0 0 auto;margin-top:2px;cursor:pointer");
                    cb.type = "checkbox";

                    var right  = el("div", "flex:1;min-width:0");
                    var topRow = el("div",
                        "display:flex;align-items:center;gap:8px;overflow:hidden");

                    var main = el("span",
                        "flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
                    main.textContent = i.qt + " × " + i.pn;

                    /* qty override (RMA partial returns) */
                    var qtyIn = el("input",
                        "display:none;width:54px;padding:4px 6px;font-size:13px;" +
                        "border:1px solid #bbb;border-radius:7px;text-align:center");
                    qtyIn.type = "number"; qtyIn.value = i.qt; qtyIn.min = "1";

                    var mag = el("button",
                        "flex:0 0 auto;padding:4px 10px;font-size:14px;line-height:1;" +
                        "border-radius:8px;border:1px solid #bbb;background:#fff;cursor:pointer");
                    mag.textContent = "🔍"; mag.type = "button";
                    mag.addEventListener("click", function (ev) {
                        ev.preventDefault(); ev.stopPropagation(); pnLookup(i.pn);
                    });

                    topRow.appendChild(main);
                    topRow.appendChild(qtyIn);
                    topRow.appendChild(mag);
                    right.appendChild(topRow);

                    if (i.ds) {
                        var stat = el("div",
                            "margin-top:3px;font-size:12px;font-weight:600;color:#555");
                        stat.textContent = "Status: " + i.ds;
                        right.appendChild(stat);
                    }

                    var desc = el("div",
                        "font-size:12px;color:#666;margin-top:2px;white-space:nowrap;" +
                        "overflow:hidden;text-overflow:ellipsis");
                    desc.textContent = i.sd;
                    right.appendChild(desc);

                    /* RMA reason dropdown */
                    var sel = el("select",
                        "display:none;width:100%;margin-top:8px;padding:7px;font-size:13px;" +
                        "border-radius:8px;border:1px solid #bbb;background:#fff");
                    ["", "Damaged in Transit", "Defective", "Ordered in Error",
                     "Overage", "Shortage", "Wrong Part Shipped"
                    ].forEach(function (x) {
                        var o = document.createElement("option");
                        o.textContent = x; sel.appendChild(o);
                    });
                    right.appendChild(sel);

                    row.appendChild(cb);
                    row.appendChild(right);
                    list.appendChild(row);

                    cb._sel   = sel;
                    cb._qtyIn = qtyIn;
                    cb._base  = i.pn;
                    cb._sdesc = i.sd;
                    cb._item  = i;

                    cb.addEventListener("change", function () {
                        if (curMode === "rma") {
                            sel.style.display   = cb.checked ? "block"        : "none";
                            qtyIn.style.display = cb.checked ? "inline-block" : "none";
                            if (!cb.checked) { sel.value = ""; qtyIn.value = i.qt; }
                        }
                    });
                });
            }

            /* Select All / None */
            var allOn = false;
            bAll.addEventListener("click", function () {
                allOn = !allOn;
                qsa("input[type=checkbox]", list).forEach(function (c) {
                    c.checked = allOn;
                    c.dispatchEvent(new Event("change"));
                });
            });

            bCa.addEventListener("click", p.close);
            bCsv.addEventListener("click", function () { orderToCSV(); });
            bStat.addEventListener("click", function () {
                var tsv = statusTSV(it);
                if (!tsv) { alert("No status-coded items found."); return; }
                copyText(tsv, function () { bStat.textContent = "✓ Copied"; });
            });

            bOk.addEventListener("click", function () {
                /* tracking mode — text the tracking info */
                if (curMode === "tracking") {
                    var lines = (trackingDiv && trackingDiv._textLines) || [];
                    if (!lines.length) { alert("No tracking info loaded yet."); return; }
                    var body = lines.join("\n").trim();
                    var sms  = /ipad|iphone|ipod/i.test(navigator.userAgent)
                        ? "sms:&body="  + encodeURIComponent(body)
                        : "sms:?body="  + encodeURIComponent(body);
                    location.href = sms;
                    return;
                }
                /* copy for email — handled by bCopy button separately */

                var checked = qsa("input[type=checkbox]:checked", list);
                if (!checked.length) { alert("Select at least one item."); return; }

                if (curMode === "tech") {
                    p.close();
                    var pnsTech = checked.map(function (c) { return c._base; });
                    if (pnsTech.length === 1) {
                        compose(
                            "smatechs@smalink.com",
                            "Tech Help For " + pnsTech[0],
                            "Tech Help Needed for " + pnsTech[0] + "\n\n"
                        );
                    } else {
                        compose(
                            "smatechs@smalink.com",
                            "Tech Help For " + pnsTech.join(", "),
                            "Tech Help Needed for the following parts:\n\n" +
                            pnsTech.join("\n") + "\n\n"
                        );
                    }
                    return;
                }

                if (curMode === "eta") {
                    p.close();
                    var pns = checked.map(function (c) { return c._base; });

                    if (pns.length === 1) {
                        /* Single part — use the normal etaPicker with buyer radio */
                        etaPicker(pns[0]);
                    } else {
                        /* Multiple parts — one email listing all parts.
                           Show the buyer picker first, then compose. */
                        var ep = makePanel("ETA Request — " + pns.length + " Parts");
                        var epPan = ep.panel;
                        var epBody = el("div", S.scroll + ";padding:14px");

                        /* part list preview */
                        var preview = el("div",
                            "background:#f5f5f8;border-radius:10px;padding:10px 12px;" +
                            "margin-bottom:14px;font-size:13px;color:#333;line-height:1.7");
                        preview.textContent = pns.join("\n");
                        preview.style.whiteSpace = "pre";
                        epBody.appendChild(preview);

                        /* resolve buyer email same way as etaPicker */
                        var bEl  = qs("#ctl00_cp1_lblBuyer");
                        var bRaw = bEl ? txt(bEl) : "";
                        var bEm  = "";
                        if (bRaw) {
                            bEm = CFG.buyerMap[bRaw] ||
                                  bRaw.toLowerCase().replace(/\s+/g, ".") + "@smalink.com";
                        }

                        function radioRow2(labelTxt, val, chk) {
                            var wrap = el("div",
                                "display:flex;align-items:center;gap:10px;padding:12px 10px;" +
                                "border:1.5px solid #ddd;border-radius:10px;margin-bottom:8px;" +
                                "cursor:pointer;background:#fafafa");
                            var rb = el("input", "width:20px;height:20px;cursor:pointer");
                            rb.type = "radio"; rb.name = "etaTo2"; rb.value = val;
                            if (chk) rb.checked = true;
                            var lbl = el("span", "font-size:14px;color:#333");
                            lbl.textContent = labelTxt;
                            wrap.appendChild(rb); wrap.appendChild(lbl);
                            wrap.addEventListener("click", function () { rb.checked = true; });
                            epBody.appendChild(wrap);
                            return rb;
                        }

                        var ra2 = radioRow2("availabilityrequest@smalink.com",
                                            "availabilityrequest@smalink.com", true);
                        var rb2 = bEm ? radioRow2(bEm, bEm, false) : null;
                        var rc2 = radioRow2("smatechs@smalink.com (Tech Help)",
                                            "smatechs@smalink.com", false);

                        epPan.appendChild(epBody);

                        var epFoot = el("div", S.foot);
                        var bOk2 = el("button", S.btnPri); bOk2.textContent = "Create Email";
                        var bCa2 = el("button", S.btnDanger);    bCa2.textContent = "Cancel";
                        epFoot.appendChild(bOk2); epFoot.appendChild(bCa2);
                        epPan.sealFooter(epFoot);

                        bCa2.addEventListener("click", ep.close);
                        bOk2.addEventListener("click", function () {
                            var isTech2 = rc2.checked;
                            var to = ra2.checked ? ra2.value : (rb2 && rb2.checked ? rb2.value : rc2.value);
                            ep.close();
                            if (isTech2) {
                                compose(
                                    "smatechs@smalink.com",
                                    "Tech Help For " + pns.join(", "),
                                    "Tech Help Needed for the following parts:\n\n" +
                                    pns.join("\n") + "\n\n"
                                );
                            } else {
                                var m3 = meta();
                                var etaBody2 = "Can we get updated ETAs on the following parts?\n\n" + pns.join("\n");
                                if (m3.ord) {
                                    etaBody2 += "\n\nOrder #: " + m3.ord;
                                    if (m3.od) etaBody2 += "\nDate Ordered: " + m3.od;
                                }
                                compose(
                                    to,
                                    "ETA Needed — " + pns.length + " Parts",
                                    etaBody2
                                );
                            }
                        });
                    }
                    return;
                }

                var lines = [];
                checked.forEach(function (c) {
                    var q   = (curMode === "rma" && c._qtyIn && c._qtyIn.value)
                                ? c._qtyIn.value : c._item.qt;
                    var rsn = (curMode === "rma" && c._sel && c._sel.value)
                                ? " — " + c._sel.value : "";
                    lines.push(q + " — " + c._base + " — " + c._sdesc + rsn);
                });
                p.close();
                done(lines, curMode === "rma");
            });

            buildList();
            setMode("order");   /* initialise toggle styles & hint */
        }

        /* ============================================================
           ORDER / RMA / ETA  — unified entry point
        ============================================================ */
        function orderOrRma() {
            var m  = meta();
            var it = items();

            picker(it, "Order / RMA / ETA", function (lines, isRma) {
                if (isRma) {
                    compose(
                        "smareturns@smalink.com",
                        "RMA for " + m.name,
                        "RMA for " + m.name +
                        "\nAccount Number: " + m.acct +
                        "\nOrder Number: "   + m.ord  +
                        "\n\n" + lines.join("\n") +
                        "\n\nPlease email me any return paperwork and call tags as needed."
                    );
                } else {
                    function buildOrderEmail(openLines) {
                        compose(
                            "",
                            "Order for " + m.name,
                            "Order Number: "    + m.ord  +
                            "\nAccount Number: " + m.acct +
                            "\nCompany Name: "   + m.name +
                            (lines.length ? "\n\nItems:\n" + lines.join("\n") : "") +
                            (openLines.length ? "\n\nOpen Pick Tickets:\n" + openLines.join("\n") : "")
                        );
                    }
                    function gatherOpenPickTickets() {
                        var rows = qsa("#ctl00_cp1_gvwShipments tr.gridrow, #ctl00_cp1_gvwShipments tr.altgridrow");
                        var out  = [];
                        rows.forEach(function (r) {
                            var c = r.querySelectorAll("td");
                            if (c.length < 6) return;
                            var pt       = txt(c[0]).trim();
                            var tracking = txt(c[3]).trim();
                            var printDt  = txt(c[2]).trim();
                            if (!tracking) out.push("PT# " + pt + (printDt ? "  \u2014  Printed " + printDt : ""));
                        });
                        return out;
                    }
                    var ptTab = qs("a[href='#picktickets']");
                    if (ptTab) {
                        ptTab.click();
                        setTimeout(function () {
                            buildOrderEmail(gatherOpenPickTickets());
                        }, 800);
                    } else {
                        buildOrderEmail([]);
                    }
                }
            });
        }

        /* ============================================================
           ETA EMAIL PICKER
        ============================================================ */
        function etaPicker(pn) {
            var p   = makePanel("ETA Request — " + pn);
            var pan = p.panel;

            /* resolve buyer email */
            var b   = qs("#ctl00_cp1_lblBuyer");
            var raw = b ? txt(b) : "";
            var em  = "";
            if (raw) {
                em = CFG.buyerMap[raw] ||
                     raw.toLowerCase().replace(/\s+/g, ".") + "@smalink.com";
            }

            var body = el("div", S.scroll + ";padding:14px");

            function radioRow(labelTxt, val, checked) {
                var wrap = el("div",
                    "display:flex;align-items:center;gap:10px;padding:12px 10px;" +
                    "border:1.5px solid #ddd;border-radius:10px;margin-bottom:8px;" +
                    "cursor:pointer;background:#fafafa");
                var rb = el("input", "width:20px;height:20px;cursor:pointer");
                rb.type = "radio"; rb.name = "etaTo"; rb.value = val;
                if (checked) rb.checked = true;
                var lbl = el("span", "font-size:14px;color:#333");
                lbl.textContent = labelTxt;
                wrap.appendChild(rb); wrap.appendChild(lbl);
                wrap.addEventListener("click", function () { rb.checked = true; });
                body.appendChild(wrap);
                return rb;
            }

            var ra = radioRow("availabilityrequest@smalink.com",
                              "availabilityrequest@smalink.com", true);
            var rb = em ? radioRow(em, em, false) : null;
            var rc = radioRow("smatechs@smalink.com (Tech Help)", "smatechs@smalink.com", false);

            pan.appendChild(body);

            var foot = el("div", S.foot);
            var bOk  = el("button", S.btnPri); bOk.textContent  = "Create Email";
            var bCa  = el("button", S.btnDanger);    bCa.textContent  = "Cancel";
            foot.appendChild(bOk); foot.appendChild(bCa);
            pan.sealFooter(foot);

            bCa.addEventListener("click", p.close);
            bOk.addEventListener("click", function () {
                var to = ra.checked ? ra.value : (rb && rb.checked ? rb.value : rc.value);
                var isTech = rc.checked;
                p.close();
                if (isTech) {
                    compose(
                        "smatechs@smalink.com",
                        "Tech Help For " + pn,
                        "Tech Help Needed for " + pn + "\n\n"
                    );
                } else {
                    var m2 = meta();
                    var etaBody = "Can we get an updated ETA on " + pn + "?";
                    if (m2.ord) {
                        etaBody += "\n\nOrder #: " + m2.ord;
                        if (m2.od) etaBody += "\nDate Ordered: " + m2.od;
                    }
                    compose(to, "ETA Needed for " + pn, etaBody);
                }
            });
        }

        /* ============================================================
           LITERATURE REQUEST
        ============================================================ */
        function literatureRequest() {
            var fixed = ["Ink Pens", "Scratch Pads", "Order Pads"];
            var links = qsa(".Catalog a.font-weight-bold");

            if (!links.length) {
                wrongPage(
                    "Literature Request",
                    "The literature list couldn't be found on this page.",
                    "Please navigate to the SMA Documents page first, then tap Literature Request again.",
                    "https://www.smalink.com/Documents",
                    "Go to Documents Page"
                );
                return;
            }

            var docs = links.map(function (l) {
                return txt(l);
            }).filter(Boolean);
            docs = fixed.concat(docs.filter(function (x) {
                return fixed.indexOf(x) === -1;
            }));

            var p   = makePanel("Literature Request");
            var pan = p.panel;
            var list = el("div", S.scroll);

            docs.forEach(function (name) {
                var row = el("div",
                    "display:flex;align-items:center;gap:10px;margin-bottom:8px;" +
                    "padding:10px 12px;border:1.5px solid #ddd;border-radius:11px;" +
                    "font-size:14px;background:#fafafa");

                var cb = el("input", "width:20px;height:20px;cursor:pointer");
                cb.type = "checkbox";

                var lbl = el("div", "flex:1;font-size:14px");
                lbl.textContent = name;

                var qIn = el("input",
                    "width:64px;padding:7px;font-size:14px;border:1.5px solid #bbb;" +
                    "border-radius:8px;text-align:center");
                qIn.type = "number"; qIn.placeholder = "Qty";

                row.appendChild(cb); row.appendChild(lbl); row.appendChild(qIn);
                list.appendChild(row);
                cb._qty  = qIn;
                cb._name = name;
            });

            pan.appendChild(list);

            var foot = el("div", S.foot);
            var bOk  = el("button", S.btnPri); bOk.textContent = "Create Email";
            var bCa  = el("button", S.btnDanger);    bCa.textContent = "Cancel";
            foot.appendChild(bOk); foot.appendChild(bCa);
            pan.sealFooter(foot);

            bCa.addEventListener("click", p.close);
            bOk.addEventListener("click", function () {
                var lines = [];
                qsa("input[type=checkbox]", list).forEach(function (cb) {
                    if (!cb.checked) return;
                    var q = cb._qty && cb._qty.value ? String(cb._qty.value).trim() : "1";
                    if (!q || q === "0") q = "1";
                    lines.push(q + " x " + cb._name);
                });
                if (!lines.length) { alert("Select at least one item."); return; }
                p.close();
                compose("Brianna.Stone@smalink.com", "Literature Request",
                    "Please see list of Literature Requested.\n\n" + lines.join("\n"));
            });
        }

        /* ============================================================
           SALES REP CHART DATA
        ============================================================ */
        function chartData() {
            var areas = qsa("area[title]");
            if (!areas.length) {
                alert("No chart data found.\nNavigate to: https://wc.smalink.net/salesreps/");
                return;
            }

            /* ── Parse & dedupe titles: "Rep Name: $12,345.67" ── */
            var seen = {}, reps = [];
            areas.forEach(function (a) {
                var t = (a.title || "").trim();
                if (!t || seen[t]) return;
                seen[t] = true;
                var parts = t.split(/:\s*\$/);
                var name  = (parts[0] || t).trim();
                var amt   = parts[1] ? parseFloat(parts[1].replace(/,/g, "")) : null;
                reps.push({ raw: t, name: name, amt: amt });
            });

            /* sort descending by amount */
            reps.sort(function (a, b) {
                return (b.amt || 0) - (a.amt || 0);
            });

            /* find max for bar scaling */
            var maxAmt = reps.reduce(function (m, r) {
                return Math.max(m, r.amt || 0);
            }, 0);

            /* ── Try to grab a date/period label from the page ── */
            var periodEl = qs(".page-title, h1, h2, #ctl00_cp1_lblTitle, #ctl00_cp1_lblPeriod");
            var period   = periodEl ? txt(periodEl) : "";

            /* ── Format helpers ── */
            function fmt(n) {
                if (n === null || isNaN(n)) return "—";
                return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            /* ── Total ── */
            var total = reps.reduce(function (s, r) { return s + (r.amt || 0); }, 0);

            /* ── Build plain-text version (for copy / SMS) ── */
            function buildText() {
                var lines = [];
                if (period) lines.push(period);
                lines.push("Sales Rep Summary");
                lines.push("─".repeat(32));
                var rank = 1;
                reps.forEach(function (r) {
                    lines.push(rank + ". " + r.name + "  " + fmt(r.amt));
                    rank++;
                });
                lines.push("─".repeat(32));
                lines.push("Total:  " + fmt(total));
                return lines.join("\n");
            }

            /* ── Panel ── */
            var p   = makePanel("📈  Sales Rep Summary");
            var pan = p.panel;

            /* period sub-header */
            if (period) {
                var sub = el("div",
                    "text-align:center;font-size:12px;color:#aaa;padding:4px 0 2px;" +
                    "background:#1a1a2e;margin-top:-1px;flex-shrink:0");
                sub.textContent = period;
                pan.appendChild(sub);
            }

            /* scrollable card list */
            var scroll = el("div", S.scroll + ";padding:10px 10px 4px");

            /* total card */
            var totCard = el("div",
                "background:#1a1a2e;color:#fff;border-radius:11px;padding:12px 14px;" +
                "margin-bottom:10px;display:flex;justify-content:space-between;" +
                "align-items:center");
            var totLbl = el("span", "font-size:13px;font-weight:700;opacity:.8");
            totLbl.textContent = "TOTAL";
            var totAmt = el("span", "font-size:20px;font-weight:800;letter-spacing:-.3px");
            totAmt.textContent = fmt(total);
            totCard.appendChild(totLbl);
            totCard.appendChild(totAmt);
            scroll.appendChild(totCard);

            /* rep cards */
            reps.forEach(function (r, idx) {
                var pct = maxAmt > 0 ? (r.amt || 0) / maxAmt : 0;

                /* medal for top 3 */
                var medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";

                var card = el("div",
                    "background:#fff;border:1.5px solid #e8e8ee;border-radius:11px;" +
                    "padding:10px 12px;margin-bottom:7px;overflow:hidden");

                /* name + amount row */
                var row1 = el("div",
                    "display:flex;justify-content:space-between;align-items:baseline;gap:8px");
                var nameEl = el("span",
                    "font-size:14px;font-weight:700;color:#1a1a2e;flex:1;" +
                    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
                nameEl.textContent = (medal ? medal + "  " : (idx + 1) + ".  ") + r.name;
                var amtEl = el("span",
                    "font-size:15px;font-weight:800;color:#1a1a2e;white-space:nowrap");
                amtEl.textContent = fmt(r.amt);
                row1.appendChild(nameEl);
                row1.appendChild(amtEl);
                card.appendChild(row1);

                /* progress bar */
                var barTrack = el("div",
                    "margin-top:7px;height:6px;background:#f0f0f5;border-radius:4px;overflow:hidden");
                var barFill = el("div",
                    "height:100%;border-radius:4px;background:" +
                    (idx === 0 ? "#f5a623" : idx === 1 ? "#9b9b9b" : idx === 2 ? "#c47c3a" : "#1a1a2e") +
                    ";width:" + Math.round(pct * 100) + "%");
                barTrack.appendChild(barFill);
                card.appendChild(barTrack);

                /* pct of total */
                var pctLbl = el("div",
                    "margin-top:4px;font-size:11px;color:#999;text-align:right");
                var sharePct = total > 0 ? ((r.amt || 0) / total * 100).toFixed(1) : "0.0";
                pctLbl.textContent = sharePct + "% of total";
                card.appendChild(pctLbl);

                scroll.appendChild(card);
            });

            pan.appendChild(scroll);

            /* ── Footer ── */
            var foot = el("div",
                "padding:8px 10px;border-top:1px solid #e0e0e0;background:#fafafa;" +
                "flex-shrink:0;display:flex;flex-direction:column;gap:6px");

            var footRow1 = el("div", "display:flex;gap:6px");

            var bCopy = el("button", S.btnPri); bCopy.textContent = "📋  Copy";
            var bSms  = el("button", S.btnPri);
            bSms.textContent = "💬  Text";
            bSms.style.background = "#2ecc71";

            var bCa   = el("button", S.btnDanger); bCa.textContent = "Close";

            [bCopy, bSms, bCa].forEach(function (b) { footRow1.appendChild(b); });
            foot.appendChild(footRow1);
            pan.sealFooter(foot);

            bCa.addEventListener("click", p.close);

            bCopy.addEventListener("click", function () {
                copyText(buildText(),
                    function () { bCopy.textContent = "✓ Copied!"; },
                    function () { alert("Copy failed."); }
                );
            });

            bSms.addEventListener("click", function () {
                /* sms: URI opens the native Messages app pre-filled */
                var body = encodeURIComponent(buildText());
                window.open("sms:?&body=" + body, "_self");
            });
        }

        /* ============================================================
           REMOTE ORDER COST  (polished panel, matches design system)
        ============================================================ */
        function remoteOrderCost() {
            var rows = qsa("tr.gridrow, tr.altgridrow");
            if (!rows.length) { alert("No items found."); return; }

            var tsv = [["Part","Description","Dealer Cost","Margin %","Our Cost"].join("\t")];

            var p   = makePanel("Remote Order Cost");
            var pan = p.panel;

            var tblWrap = el("div",
                S.scroll + ";padding:0;font-family:monospace;font-size:13px");

            var tbl = document.createElement("table");
            tbl.style.cssText =
                "width:100%;border-collapse:collapse;font-size:13px;min-width:360px";

            var hdrRow = document.createElement("tr");
            hdrRow.style.background = "#1a1a2e";
            ["Part","Description","Dealer Cost","Margin %","Our Cost"].forEach(function (h) {
                var th = document.createElement("th");
                th.textContent = h;
                th.style.cssText =
                    "padding:8px 8px;text-align:left;color:#fff;font-weight:700;white-space:nowrap";
                hdrRow.appendChild(th);
            });
            tbl.appendChild(hdrRow);

            rows.forEach(function (r, idx) {
                var part   = r.querySelector("[id*='lblItemId']");
                var desc   = r.querySelector("[id*='lblItemDesc']");
                var dealer = r.querySelector("[id*='lblUnitPrice']");
                var mEl    = r.querySelector("[id*='DisplayProfitV'] small") ||
                             r.querySelector("[id*='DisplayProfit']");

                if (!dealer || !part || !desc) return;

                var partNum    = txt(part);
                var descTxt    = txt(desc);
                var dealerCost = pN(txt(dealer));
                var margin     = pN(mEl ? txt(mEl) : "0");
                var ourCost    = (dealerCost * (1 - margin / 100)).toFixed(2);
                var marginTxt  = margin.toFixed(2) + "%";

                tsv.push([partNum, descTxt,
                    dealerCost.toFixed(2), marginTxt, ourCost].join("\t"));

                var tr = document.createElement("tr");
                tr.style.background = idx % 2 === 0 ? "#fff" : "#f7f7fb";
                [partNum, descTxt, "$" + dealerCost.toFixed(2), marginTxt, "$" + ourCost].forEach(
                    function (val) {
                        var td = document.createElement("td");
                        td.textContent = val;
                        td.style.cssText =
                            "padding:7px 8px;border-bottom:1px solid #e8e8e8;" +
                            "vertical-align:top;color:#222;white-space:nowrap";
                        tr.appendChild(td);
                    }
                );
                tbl.appendChild(tr);
            });

            tblWrap.appendChild(tbl);
            pan.appendChild(tblWrap);

            var foot = el("div", S.foot);
            var bCopy = el("button", S.btnPri); bCopy.textContent = "Copy for Excel";
            var bCa   = el("button", S.btnDanger);    bCa.textContent   = "Close";
            foot.appendChild(bCopy); foot.appendChild(bCa);
            pan.sealFooter(foot);

            bCa.addEventListener("click", p.close);
            bCopy.addEventListener("click", function () {
                copyText(tsv.join("\n"),
                    function () { bCopy.textContent = "✓ Copied!"; },
                    function () { alert("Copy failed."); }
                );
            });
        }

        /* ============================================================
           ORDER VIEWER -- combined with cost/margin toggle
        ============================================================ */
        function orderViewer() {
            var docs = [document];
            for (var fi = 0; fi < window.frames.length; fi++) {
                try { if (window.frames[fi].document) docs.push(window.frames[fi].document); }
                catch (e) {}
            }

            var partRows = [];
            docs.forEach(function (d) {
                try {
                    d.querySelectorAll("tr.altgridrow,tr.gridrow").forEach(function (r) {
                        if (r.querySelector(
                            "span[id*='lblItemId'],span[id*='lblItemDesc']," +
                            "span[id*='lblItemDescription']"
                        )) partRows.push(r);
                    });
                } catch (e) {}
            });

            var orderTotal = txt(qs("#ctl00_cp1_lblTotalAmount"));
            var netWeight  = txt(qs("#ctl00_cp1_lblEstimatedNetWeight"));

            var viewItems = [];
            partRows.forEach(function (r, i) {
                var dealerEl   = r.querySelector("span[id*='lblUnitPrice']");
                var mEl        = r.querySelector("[id*='DisplayProfitV'] small") ||
                                 r.querySelector("[id*='DisplayProfit']");
                var dealerCost = pN(txt(dealerEl));
                var margin     = pN(mEl ? txt(mEl) : "0");
                viewItems.push({
                    idx:    i,
                    part:   txt(r.querySelector("span[id*='lblItemId']") || r.querySelector("b")),
                    desc:   txt(r.querySelector("span[id*='lblItemDesc']") ||
                               r.querySelector("span[id*='lblItemDescription']")),
                    longDesc: txt(r.querySelector("small")) || "",
                    qty:    txt(r.querySelector("span[id*='lblUnitQuantity']")) || "",
                    cost:   txt(r.querySelector("span[id*='lblUnitPrice']"))    || "",
                    ext:    txt(r.querySelector("span[id*='lblExtendedPrice']")) || "",
                    dealer: dealerCost.toFixed(2),
                    margin: margin.toFixed(2),
                    our:    (dealerCost * (1 - margin / 100)).toFixed(2)
                });
            });

            if (!viewItems.length) { alert("No items found on this page."); return; }

            var counts = {};
            viewItems.forEach(function (i) {
                counts[i.part] = (counts[i.part] || 0) + 1;
            });

            var showCost = false;

            /* Full-screen overlay */
            var ov = el("div",
                "position:fixed;inset:0;background:#fff;z-index:999999;display:flex;" +
                "flex-direction:column;font-family:system-ui");

            /* top bar */
            var topBar = el("div",
                "background:#1a1a2e;color:#fff;padding:10px 14px;display:flex;" +
                "align-items:center;gap:10px;flex-shrink:0");

            var titleLbl = el("span", "font-weight:700;font-size:15px;margin-right:auto");
            titleLbl.textContent = "Order Viewer";
            topBar.appendChild(titleLbl);

            /* Sort checkbox */
            var sortWrap = el("label",
                "display:flex;align-items:center;gap:5px;font-size:13px;" +
                "cursor:pointer;white-space:nowrap;color:#eee");
            var sortCb = el("input", "width:16px;height:16px;cursor:pointer");
            sortCb.type = "checkbox"; sortCb.checked = true;
            sortWrap.appendChild(sortCb);
            sortWrap.appendChild(document.createTextNode("Sort by PN"));
            topBar.appendChild(sortWrap);

            /* ---- Export button + dropdown ---- */
            var exportWrap = el("div", "position:relative");
            var bExport = el("button",
                "padding:7px 12px;font-size:13px;border:none;border-radius:8px;" +
                "background:#3a86ff;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap");
            bExport.textContent = "Export \u25be";
            exportWrap.appendChild(bExport);

            var exportMenu = el("div",
                "display:none;position:absolute;bottom:calc(100% + 4px);left:0;" +
                "background:#fff;border:1.5px solid #ddd;border-radius:10px;" +
                "box-shadow:0 -4px 16px rgba(0,0,0,.18);min-width:190px;z-index:9999;overflow:hidden");

            function exportMenuItem(label, handler) {
                var item = el("div",
                    "padding:11px 16px;font-size:13px;font-weight:600;cursor:pointer;" +
                    "color:#1a1a2e;border-bottom:1px solid #f0f0f0");
                item.textContent = label;
                item.addEventListener("mouseenter", function () { item.style.background = "#f5f5f5"; });
                item.addEventListener("mouseleave", function () { item.style.background = ""; });
                item.addEventListener("click", function () {
                    exportMenu.style.display = "none";
                    handler();
                });
                exportMenu.appendChild(item);
            }

            function getSorted() {
                var list = viewItems.slice();
                if (sortCb.checked) list.sort(function (a, b) {
                    return a.part.localeCompare(b.part, undefined,
                        { numeric: true, sensitivity: "base" });
                });
                return list;
            }

            /* Copy for Excel -- base columns only, NEVER cost/margin */
            exportMenuItem("Copy for Excel", function () {
                var list = getSorted();
                var rows = [["Part Number","Description","Qty","Cost","Extended"].join("\t")];
                list.forEach(function (i) {
                    rows.push([i.part, i.desc, i.qty, i.cost, i.ext].join("\t"));
                });
                copyText(rows.join("\n"),
                    function () {
                        bExport.textContent = "\u2713 Copied!";
                        setTimeout(function(){ bExport.textContent = "Export \u25be"; }, 2000);
                    },
                    function () { alert("Copy failed."); }
                );
            });

            /* Download .txt -- base columns only, NEVER cost/margin */
            exportMenuItem("Download .txt", function () {
                var list = getSorted();
                var rows = [["Part Number","Description","Qty","Cost","Extended"].join("\t")];
                list.forEach(function (i) {
                    rows.push([i.part, i.desc, i.qty, i.cost, i.ext].join("\t"));
                });
                var blob = new Blob([rows.join("\n")], { type: "text/plain" });
                var url  = URL.createObjectURL(blob);
                var a    = document.createElement("a");
                a.href = url;
                a.download = "order_" + new Date().toISOString().slice(0,10) + ".txt";
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
            });

            /* Download .csv -- includes long description, iOS-safe */
            exportMenuItem("Download .csv", function () {
                var list = getSorted();
                function g(t) { return '"' + String(t || "").replace(/"/g, '""') + '"'; }
                var csv = ["Part Number","Short Description","Long Description","Qty","Unit Price","Extended"].join(",") + "\n";
                list.forEach(function (i) {
                    csv += [i.part, i.desc, i.longDesc, i.qty, i.cost, i.ext].map(g).join(",") + "\n";
                });
                var blob = new Blob([csv], { type: "text/csv" });
                var url  = URL.createObjectURL(blob);
                var isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);
                if (isIOS) {
                    window.open(url, "_blank");
                } else {
                    var a = document.createElement("a");
                    a.href = url;
                    a.download = "order_" + new Date().toISOString().slice(0,10) + ".csv";
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }
                setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
            });

            exportWrap.appendChild(exportMenu);
            /* exportWrap goes into bottom bar — not appended to topBar */

            bExport.addEventListener("click", function (e) {
                e.stopPropagation();
                var isOpen = exportMenu.style.display === "block";
                exportMenu.style.display = isOpen ? "none" : "block";
            });
            document.addEventListener("click", function (e) {
                if (!exportWrap.contains(e.target)) {
                    exportMenu.style.display = "none";
                }
            });

            /* Email copy and Close declared here, appended to bottom bar below */
            var bCopyHtml = el("button",
                "flex:1;padding:9px 12px;font-size:13px;border:none;border-radius:8px;" +
                "background:#e8e01a;color:#111;font-weight:700;cursor:pointer;white-space:nowrap");
            bCopyHtml.textContent = "Copy (Email)";

            var bClose = el("button",
                "flex:1;padding:9px 12px;font-size:13px;border:none;border-radius:8px;" +
                "background:#e74c3c;color:#fff;font-weight:700;cursor:pointer");
            bClose.textContent = "\u2715 Close";

            /* Money bag cost toggle -- top-right corner, two states only */
            var bCostToggle = el("button",
                "width:34px;height:34px;flex-shrink:0;" +
                "border:none;border-radius:50%;background:rgba(255,255,255,.15);" +
                "font-size:20px;cursor:pointer;display:flex;align-items:center;" +
                "justify-content:center;padding:0;transition:background .2s,box-shadow .2s;" +
                "filter:grayscale(1);opacity:.6");
            bCostToggle.textContent = "\uD83D\uDCB0";
            bCostToggle.title = "Toggle cost & margin";
            topBar.appendChild(bCostToggle);

            bCostToggle.addEventListener("click", function (e) {
                e.stopPropagation();
                showCost = !showCost;
                if (showCost) {
                    bCostToggle.style.filter = "none";
                    bCostToggle.style.opacity = "1";
                    bCostToggle.style.background = "#27ae60";
                    bCostToggle.style.boxShadow = "0 0 10px #27ae60";
                } else {
                    bCostToggle.style.filter = "grayscale(1)";
                    bCostToggle.style.opacity = ".6";
                    bCostToggle.style.background = "rgba(255,255,255,.15)";
                    bCostToggle.style.boxShadow = "";
                }
                renderTable(sortCb.checked, showCost);
            });

            ov.appendChild(topBar);

            /* summary bar */
            var sumBar = el("div",
                "background:#f0f0f8;border-bottom:1px solid #ddd;padding:8px 14px;" +
                "font-size:13px;display:flex;gap:16px;flex-wrap:wrap;flex-shrink:0");
            if (orderTotal) {
                var sTotal = el("span", "font-weight:700");
                sTotal.textContent = orderTotal;
                sumBar.appendChild(sTotal);
            }
            if (netWeight) {
                var sWt = el("span", "color:#555");
                sWt.textContent = "Net Weight: " + netWeight;
                sumBar.appendChild(sWt);
            }
            var sLegend = el("span","display:inline-flex;align-items:center;gap:5px;color:#555");
            var sBox    = el("span",
                "display:inline-block;width:12px;height:12px;background:#ffd6d6;" +
                "border:1px solid #cc9999;border-radius:2px");
            sLegend.appendChild(sBox);
            sLegend.appendChild(document.createTextNode("= duplicate part number"));
            sumBar.appendChild(sLegend);
            ov.appendChild(sumBar);

            /* table */
            var tblWrap = el("div",
                "flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:0");
            var tbl = document.createElement("table");
            tbl.style.cssText =
                "border-collapse:collapse;font-family:monospace;font-size:13px;width:100%";

            function renderTable(sorted, showExtra) {
                var list = viewItems.slice();
                if (sorted) list.sort(function (a, b) {
                    return a.part.localeCompare(b.part, undefined,
                        { numeric: true, sensitivity: "base" });
                });
                tbl.innerHTML = "";
                var hRow = document.createElement("tr");
                hRow.style.cssText = "background:#1a1a2e;position:sticky;top:0";
                var cols = ["Part Number","Description","Qty","Cost","Extended"];
                if (showExtra) cols = cols.concat(["Dealer Cost","Margin %","Our Cost"]);
                cols.forEach(function (h) {
                    var th = document.createElement("th");
                    th.textContent = h;
                    th.style.cssText =
                        "padding:9px 10px;text-align:left;color:#fff;white-space:nowrap;" +
                        "border-right:1px solid #2d2d4e;font-weight:700;font-size:13px";
                    if (showExtra && (h === "Dealer Cost" || h === "Margin %" || h === "Our Cost")) {
                        th.style.background = "#2d4a2d";
                    }
                    hRow.appendChild(th);
                });
                tbl.appendChild(hRow);
                list.forEach(function (i, idx) {
                    var isDup = counts[i.part] > 1;
                    var tr = document.createElement("tr");
                    tr.style.background = isDup ? "#ffd6d6" : (idx % 2 === 0 ? "#fff" : "#f7f7fb");
                    var vals = [i.part, i.desc, i.qty, i.cost, i.ext];
                    if (showExtra) vals = vals.concat([i.dealer, i.margin + "%", i.our]);
                    vals.forEach(function (v, vi) {
                        var td = document.createElement("td");
                        td.textContent = v;
                        td.style.cssText =
                            "padding:7px 10px;border-bottom:1px solid #e8e8e8;" +
                            "vertical-align:top;white-space:nowrap";
                        if (showExtra && vi >= 5) {
                            td.style.background = isDup ? "" :
                                (idx % 2 === 0 ? "#f0fff0" : "#e8f8e8");
                            td.style.color = "#1a5c1a";
                        }
                        tr.appendChild(td);
                    });
                    tbl.appendChild(tr);
                });
                tblWrap.innerHTML = "";
                tblWrap.appendChild(tbl);
            }

            /* bottom bar -- Export, Copy Email, Close */
            var botBar = el("div",
                "background:#fff;border-top:1.5px solid #ddd;padding:10px 14px;" +
                "display:flex;gap:8px;align-items:center;flex-shrink:0;" +
                "padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))");

            /* Export wrap goes into bottom bar */
            exportWrap.style.flex = "1";
            botBar.appendChild(exportWrap);
            botBar.appendChild(bCopyHtml);
            botBar.appendChild(bClose);
            ov.appendChild(tblWrap);
            ov.appendChild(botBar);
            document.body.appendChild(ov);
            renderTable(true, false);

            sortCb.onchange = function () { renderTable(sortCb.checked, showCost); };

            /* Email copy -- always base columns only, never cost/margin */
            bCopyHtml.addEventListener("click", function () {
                var emailTbl = document.createElement("table");
                emailTbl.style.cssText = tbl.style.cssText;
                var list = getSorted();

                /* summary row above the table if we have totals */
                if (orderTotal || netWeight) {
                    var sumRow = document.createElement("tr");
                    var sumTd  = document.createElement("td");
                    sumTd.colSpan = 5;
                    sumTd.style.cssText =
                        "padding:8px 10px;background:#1a1a2e;color:#fff;" +
                        "font-weight:700;font-size:13px";
                    var sumParts = [];
                    if (orderTotal) sumParts.push("Order Total: " + orderTotal);
                    if (netWeight)  sumParts.push("Net Weight: "  + netWeight);
                    sumTd.textContent = sumParts.join("   |   ");
                    sumRow.appendChild(sumTd);
                    emailTbl.appendChild(sumRow);
                }

                var eHRow = document.createElement("tr");
                eHRow.style.cssText = "background:#1a1a2e";
                ["Part Number","Description","Qty","Cost","Extended"].forEach(function (h) {
                    var th = document.createElement("th");
                    th.textContent = h;
                    th.style.cssText =
                        "padding:9px 10px;text-align:left;color:#fff;" +
                        "white-space:nowrap;border-right:1px solid #2d2d4e;" +
                        "font-weight:700;font-size:13px";
                    eHRow.appendChild(th);
                });
                emailTbl.appendChild(eHRow);
                list.forEach(function (i, idx) {
                    var isDup = counts[i.part] > 1;
                    var tr = document.createElement("tr");
                    tr.style.background = isDup ? "#ffd6d6" :
                        (idx % 2 === 0 ? "#ffffff" : "#ddeeff");
                    [i.part, i.desc, i.qty, i.cost, i.ext].forEach(function (v) {
                        var td = document.createElement("td");
                        td.textContent = v;
                        td.style.cssText =
                            "padding:7px 10px;border-bottom:1px solid #e8e8e8;" +
                            "vertical-align:top;white-space:nowrap";
                        tr.appendChild(td);
                    });
                    emailTbl.appendChild(tr);
                });
                try {
                    navigator.clipboard.write([
                        new ClipboardItem({
                            "text/html": new Blob([emailTbl.outerHTML], { type: "text/html" })
                        })
                    ]).then(function () {
                        bCopyHtml.textContent = "\u2713 Copied!";
                        setTimeout(function(){ bCopyHtml.textContent = "Copy (Email)"; }, 2000);
                    });
                } catch (e) {
                    alert("HTML copy not supported on this browser.");
                }
            });

            bClose.addEventListener("click", function () {
                document.body.removeChild(ov);
            });
        }

        /* ============================================================
           ACTION DEFINITIONS  — page-aware
        ============================================================ */

        /* Actions always visible (search tools work anywhere) */
        var globalActions = [
            {
                label: "🔍  PN Search",
                fn: function () {
                    var q = (window.getSelection ? window.getSelection().toString() : "").trim();
                    if (!q) q = prompt("Part Number", "");
                    if (!q) return;
                    location = "https://www.smalink.com/c?search=" + encodeURIComponent(q);
                    window.open(
                        "https://wc.smalink.net/common/inventory/itemlookup.aspx?searchstring=" +
                        encodeURIComponent(q)
                    );
                }
            },
            {
                label: "👤  Customer Search",
                fn: function () {
                    var q = prompt("Customer", "");
                    if (q) location =
                        "https://wc.smalink.net/common/customers/shiptolisting.aspx?searchstring=" +
                        encodeURIComponent(q);
                }
            },
            {
                label: "📦  Order #",
                fn: function () {
                    var q = prompt("Order Number", "");
                    if (q) location =
                        "https://wc.smalink.net/common/OrderDetails.aspx?OrderId=" +
                        encodeURIComponent(q);
                }
            },
            {
                label: "🧾  Invoice #",
                fn: function () {
                    var q = prompt("Invoice Number", "");
                    if (q) location =
                        "https://wc.smalink.net/common/invoicedetails.aspx?invoiceid=" +
                        encodeURIComponent(q);
                }
            }
        ];

        /* Actions that only show on specific pages */
        var pageActions = [];

        /* Shared: extract part number from whatever is visible on the page */
        function detectPN() {
            /* 0 — ItemID in URL query string (ItemDetail page) */
            var urlMatch = location.search.match(/[?&]itemid=([^&]+)/i);
            if (urlMatch) return decodeURIComponent(urlMatch[1]).trim();
            var selectors = [
                "#ctl00_cp1_lblItemIdWeb",
                "#ctl00_cp1_lblItemID",
                "#ctl00_cp1_lblItemId",
                "#ctl00_cp1_lblItemNumber",
                "#ctl00_cp1_lblPartNumber",
                "#lblPopupTitle",
                "#ctl00_cp1_lblPopupTitle",
                "#ctl00_cp1_FormView1_lblItemIdWeb",
                "#ctl00_cp1_FormView1_lblItemID"
            ];
            for (var si = 0; si < selectors.length; si++) {
                var found = qs(selectors[si]);
                if (found) {
                    var v = txt(found).replace(/^item\s*[-\u2013]\s*/i, "").trim();
                    if (v) return v;
                }
            }

            /* 2 — Page <title> tag: often "Item Lookup - 800-3PS200 - Web Connect" */
            var pageTitle = document.title || "";
            var titleMatch = pageTitle.match(
                /[-\u2013]\s*([A-Z0-9][A-Z0-9\-]{2,})\s*[-\u2013]/i
            );
            if (titleMatch) return titleMatch[1].trim();

            /* 3 — Scan headings and bold tags for "Item - XXXXX" pattern.
                   Use only the direct/own text to avoid picking up child content. */
            var candidates = qsa("h1,h2,h3,h4,span,b,label,div.page-title");
            for (var ci = 0; ci < candidates.length; ci++) {
                /* own text only — skip elements with many children */
                var node = candidates[ci];
                var ownTxt = "";
                node.childNodes.forEach(function (n) {
                    if (n.nodeType === 3) ownTxt += n.nodeValue;
                });
                ownTxt = ownTxt.trim();
                if (/^item\s*[-\u2013]\s*\S+/i.test(ownTxt) && ownTxt.length < 60) {
                    return ownTxt.replace(/^item\s*[-\u2013]\s*/i, "").trim();
                }
                /* also catch bare part-number-looking strings in headings */
                if (/^[A-Z]{1,5}[\-]?\d[\w\-]{2,}$/i.test(ownTxt) && ownTxt.length < 30) {
                    return ownTxt;
                }
            }

            /* 4 — Selected text on the page */
            var sel = window.getSelection ? window.getSelection().toString().trim() : "";
            if (sel && sel.length < 40 && !/\s{2}/.test(sel)) return sel;

            return "";
        }

        /* If on an order page, show a scrollable list of all parts to pick from.
           Otherwise try to auto-detect, then fall back to a text prompt.        */
        function etaAction() {
            /* On order page — build a part picker from the order lines */
            if (PAGE.isOrder) {
                var orderItems = items();
                if (orderItems.length) {
                    var pp = makePanel("Select Part for ETA");
                    var pan = pp.panel;

                    var scroll = el("div", S.scroll);

                    orderItems.forEach(function (i) {
                        var rowBg  = i.bo ? "#ffe5e5" : i.ds === "C" ? "#fff8dc" : "#fff";
                        var rowBdr = i.bo ? "#cc0000" : i.ds === "C" ? "#d4a017" : "#eee";

                        var row = el("div",
                            "padding:11px 14px;border-bottom:2px solid " + rowBdr + ";" +
                            "cursor:pointer;font-size:14px;display:flex;" +
                            "flex-direction:column;gap:2px;background:" + rowBg);

                        var pnLine = el("div",
                            "font-weight:700;color:#1a1a2e;display:flex;align-items:center;gap:8px");
                        var pnTxt = el("span", "");
                        pnTxt.textContent = i.pn;
                        pnLine.appendChild(pnTxt);

                        if (i.ds) {
                            var badge = el("span",
                                "font-size:11px;font-weight:700;padding:2px 7px;" +
                                "border-radius:6px;letter-spacing:.4px;" +
                                (i.bo
                                    ? "background:#cc0000;color:#fff"
                                    : i.ds === "C"
                                        ? "background:#d4a017;color:#fff"
                                        : "background:#ddd;color:#444"));
                            badge.textContent = i.ds;
                            pnLine.appendChild(badge);
                        }

                        var descLine = el("div", "font-size:12px;color:#666");
                        descLine.textContent = (i.qt ? i.qt + " × " : "") + i.sd;

                        row.appendChild(pnLine);
                        row.appendChild(descLine);

                        row.addEventListener("click", function () {
                            pp.close();
                            etaPicker(i.pn);
                        });
                        row.addEventListener("touchstart", function () {
                            row.style.filter = "brightness(0.93)";
                        }, { passive: true });
                        row.addEventListener("touchend", function () {
                            row.style.filter = "";
                        }, { passive: true });

                        scroll.appendChild(row);
                    });

                    pan.appendChild(scroll);

                    var foot = el("div", S.foot);
                    var bCa  = el("button", S.btnDanger); bCa.textContent = "Cancel";
                    bCa.addEventListener("click", pp.close);
                    foot.appendChild(bCa);
                    pan.sealFooter(foot);
                    return;
                }
            }

            /* On item lookup or anywhere else — try to auto-detect, then prompt */
            var pn = detectPN();
            if (!pn) pn = prompt("Part Number", "");
            if (!pn) return;
            etaPicker(pn);
        }

        if (PAGE.isOrder) {
            pageActions.push(
                { label: "📋  Order / RMA / ETA / Tech Email", fn: orderOrRma }
            );
        }

        /* ============================================================
           INVOICE META EXTRACTION
        ============================================================ */
        function invMeta() {
            var inv = "", name = "", ord = "", carrier = "", tracking = "";
            /* Invoice # */
            var tbl = qs("#ctl00_cp1_DetailsView1");
            if (tbl) {
                qsa("tr", tbl).forEach(function (r) {
                    var label = r.cells && r.cells[0] ? txt(r.cells[0]) : "";
                    var val   = r.cells && r.cells[1] ? txt(r.cells[1]) : "";
                    if (label.indexOf("Invoice #") > -1) inv      = val;
                    if (label.indexOf("Shipped To") > -1) name    = val;
                    if (label.indexOf("Carrier") > -1) carrier    = val;
                });
            }
            /* Tracking # has its own span */
            var trkEl = qs("#ctl00_cp1_DetailsView1_lblTrackingNumber");
            if (trkEl) tracking = txt(trkEl);
            /* Order # */
            var ordEl = qs("#ctl00_cp1_DetailsView1_lblSourceId");
            if (ordEl) ord = txt(ordEl);
            return { inv: inv, name: name, ord: ord, carrier: carrier, tracking: tracking };
        }

        /* ============================================================
           INVOICE ITEMS EXTRACTION
        ============================================================ */
        function invItems() {
            var a = [];
            qsa("#ctl00_cp1_GridView1 tr.gridrow, #ctl00_cp1_GridView1 tr.altgridrow").forEach(function (r) {
                var pnEl = r.querySelector("span[id*='lblItem'] b");
                var sdEl = r.querySelector("span[id*='lblItemDesc']");
                if (!pnEl) return;
                /* qty shipped — visible-phone div or hidden-phone td */
                var qtEl = r.querySelector(".hidden-phone:nth-child(4)");
                var qt   = qtEl ? txt(qtEl).replace(/[^\d.]/g, "").replace(/\.0+$/, "") : "";
                if (!qt) {
                    /* fallback: parse mobile div "Qty Shipped: 50.000" */
                    var mob = r.querySelector(".hidden-desktop");
                    if (mob) {
                        var divs = qsa("div", mob);
                        divs.forEach(function (d) {
                            var t = txt(d);
                            if (t.indexOf("Qty Shipped") > -1)
                                qt = t.replace(/[^\d.]/g, "").replace(/\.0+$/, "");
                        });
                    }
                }
                a.push({
                    pn: txt(pnEl),
                    sd: sdEl ? txt(sdEl).substring(0, 30) : "",
                    qt: qt || "1"
                });
            });
            a.sort(function (x, y) {
                return x.pn.localeCompare(y.pn, undefined, { numeric: true });
            });
            return a;
        }

        /* ============================================================
           INVOICE ACTION  —  RMA / Tech / Tracking tabs
        ============================================================ */
        function invoiceAction() {
            var m  = invMeta();
            var it = invItems();

            if (!it.length && !m.tracking) {
                alert("No invoice items found on this page.");
                return;
            }

            var p   = makePanel("Invoice Actions — " + (m.name || "Invoice"));
            var pan = p.panel;

            /* ── Segmented toggle: RMA | Tech | Tracking ── */
            var IMODES = [
                { key: "rma",      label: "RMA"      },
                { key: "tech",     label: "Tech"      },
                { key: "tracking", label: "Tracking"  }
            ];
            var curIMode = "rma";

            var segWrap = el("div",
                "padding:8px 10px;border-bottom:1px solid #e0e0e0;background:#f5f5f8;" +
                "flex-shrink:0;display:flex;gap:0;border-radius:0");

            var iSegBtns = {};
            IMODES.forEach(function (m2, idx) {
                var last = idx === IMODES.length - 1;
                var b = el("button",
                    "flex:1;min-height:36px;font-size:13px;font-weight:700;" +
                    "border:1.5px solid #1a1a2e;cursor:pointer;transition:background .12s;" +
                    "border-radius:" +
                        (idx === 0 ? "8px 0 0 8px" : last ? "0 8px 8px 0" : "0") +
                    ";margin-left:" + (idx === 0 ? "0" : "-1.5px"));
                b.textContent = m2.label;
                iSegBtns[m2.key] = b;
                b.addEventListener("click", function () { setIMode(m2.key); });
                segWrap.appendChild(b);
            });
            pan.appendChild(segWrap);

            /* ── Hint ── */
            var iHint = el("div",
                "padding:5px 12px;font-size:11px;color:#777;background:#fafafa;" +
                "border-bottom:1px solid #ebebeb;flex-shrink:0");
            pan.appendChild(iHint);

            /* ── Item list (RMA / Tech) ── */
            var iList = el("div", S.scroll);
            pan.appendChild(iList);

            /* ── Tracking panel ── */
            var iTrackDiv = el("div", S.scroll + ";padding:10px 12px;display:none");
            pan.appendChild(iTrackDiv);

            /* ── Footer ── */
            var iFoot = el("div",
                "padding:8px 10px;border-top:1px solid #e0e0e0;background:#fafafa;" +
                "flex-shrink:0;display:flex;flex-direction:column;gap:6px");

            var iFootRow = el("div", "display:flex;gap:4px");
            var iBtnOk = el("button", S.btnPri);
            var iBtnCopy = el("button", S.btn); iBtnCopy.textContent = "📋 Copy";
            var iBtnOutlook = el("button", S.btn); iBtnOutlook.textContent = "🔍 Mail";
            var iBtnCa  = el("button", S.btnDanger);  iBtnCa.textContent  = "Cancel";
            iBtnCopy.style.display    = "none";
            iBtnOutlook.style.display = "none";
            /* compact style so all 4 fit on one row */
            [iBtnOk, iBtnCopy, iBtnOutlook, iBtnCa].forEach(function (b) {
                b.style.fontSize   = "12px";
                b.style.padding    = "5px 4px";
                b.style.minHeight  = "32px";
                b.style.flex       = "1 1 0";
                b.style.minWidth   = "0";
                iFootRow.appendChild(b);
            });
            iFoot.appendChild(iFootRow);
            pan.sealFooter(iFoot);

            /* ── Build item rows ── */
            function buildIList() {
                iList.innerHTML = "";
                it.forEach(function (i) {
                    var row = el("div",
                        S.row + ";background:#fafafa;border:1.5px solid #ddd");
                    var cb = el("input",
                        "width:20px;height:20px;flex:0 0 auto;margin-top:2px;cursor:pointer");
                    cb.type = "checkbox";

                    var right  = el("div", "flex:1;min-width:0");

                    var topRow = el("div",
                        "display:flex;align-items:center;gap:8px;overflow:hidden");

                    var main   = el("div",
                        "flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px");
                    main.textContent = i.qt + " × " + i.pn;

                    /* qty override input (shown when checked in RMA mode) */
                    var qtyIn = el("input",
                        "display:none;width:54px;padding:4px 6px;font-size:13px;" +
                        "border:1px solid #bbb;border-radius:7px;text-align:center");
                    qtyIn.type = "number"; qtyIn.value = i.qt; qtyIn.min = "1";

                    topRow.appendChild(main);
                    topRow.appendChild(qtyIn);
                    right.appendChild(topRow);

                    var desc = el("div", "font-size:12px;color:#666;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
                    desc.textContent = i.sd;
                    right.appendChild(desc);

                    /* RMA reason dropdown */
                    var sel = el("select",
                        "display:none;width:100%;margin-top:8px;padding:7px;font-size:13px;" +
                        "border-radius:8px;border:1px solid #bbb;background:#fff");
                    ["", "Damaged in Transit", "Defective", "Ordered in Error",
                     "Overage", "Shortage", "Wrong Part Shipped"
                    ].forEach(function (x) {
                        var o = document.createElement("option");
                        o.textContent = x; sel.appendChild(o);
                    });
                    right.appendChild(sel);

                    row.appendChild(cb);
                    row.appendChild(right);
                    iList.appendChild(row);

                    cb._sel   = sel;
                    cb._qtyIn = qtyIn;
                    cb._item  = i;

                    cb.addEventListener("change", function () {
                        if (curIMode === "rma") {
                            sel.style.display   = cb.checked ? "block"        : "none";
                            qtyIn.style.display = cb.checked ? "inline-block" : "none";
                            if (!cb.checked) { sel.value = ""; qtyIn.value = i.qt; }
                        }
                    });
                });
            }

            /* ── Build tracking panel ── */
            function buildITrackingPanel() {
                iTrackDiv.innerHTML = "";
                var lines = [];
                if (m.inv)  lines.push("Invoice #" + m.inv);
                if (m.name) lines.push(m.name);
                if (m.ord)  lines.push("Order #" + m.ord);
                lines.push("");

                if (m.tracking) {
                    /* carrier → URL */
                    var CARRIERS = [
                        { key:"UPS",          fn:function(n){ return "https://www.ups.com/track?tracknum="+n; }},
                        { key:"FEDEX FREIGHT",fn:function(n){ return "https://www.fedexfreight.com/fedextrack/?trknbr="+n+"&trkqual=~"+n+"~FDFR"; }},
                        { key:"FEDEX",        fn:function(n){ return "https://www.fedex.com/fedextrack/?trknbr="+n; }},
                        { key:"USPS",         fn:function(n){ return "https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1="+n; }},
                        { key:"SOUTHEASTERN", fn:function(n){ return "https://www.sefl.com/webconnect/tracing?Type=PN&RefNum1="+n; }},
                        { key:"SEFL",         fn:function(n){ return "https://www.sefl.com/webconnect/tracing?Type=PN&RefNum1="+n; }},
                        { key:"ESTES",        fn:function(n){ return "https://www.estesexpress.com/myestes/tracking?pro="+n; }},
                        { key:"AVERITT",      fn:function(n){ return "https://www.averittexpress.com/trk.action?type=P&id="+n; }},
                        { key:"SAIA",         fn:function(n){ return "https://www.saia.com/track/details;pro="+n; }},
                        { key:"OLD DOMINION", fn:function(n){ return "https://www.odfl.com/Trace/TraceAction.do?pro="+n; }},
                        { key:"ODW",          fn:function(n){ return "https://www.odfl.com/Trace/TraceAction.do?pro="+n; }},
                        { key:"DAYTON",       fn:function(n){ return "https://tools.daytonfreight.com/tracking/detail/"+n; }},
                        { key:"AAA COOPER",   fn:function(n){ return "https://www.aaacooper.com/Transit/ProTrackResults.aspx?ProNum="+n; }},
                        { key:"AAA-COOPER",   fn:function(n){ return "https://www.aaacooper.com/Transit/ProTrackResults.aspx?ProNum="+n; }},
                        { key:"AAACOOPER",    fn:function(n){ return "https://www.aaacooper.com/Transit/ProTrackResults.aspx?ProNum="+n; }},
                        { key:"XPO",          fn:function(n){ return "https://ext-web.ltl-xpo.com/public-app/shipments?referenceNumber="+n; }},
                        { key:"CONWAY",       fn:function(n){ return "https://ext-web.ltl-xpo.com/public-app/shipments?referenceNumber="+n; }},
                        { key:"N&M",          fn:function(n){ return "https://www.nmtransfer.com/quickTrack?pro="+n; }},
                        { key:"N & M",        fn:function(n){ return "https://www.nmtransfer.com/quickTrack?pro="+n; }},
                        { key:"NMTRANSFER",   fn:function(n){ return "https://www.nmtransfer.com/quickTrack?pro="+n; }},
                        { key:"SPEE-DEE",     fn:function(n){ return "https://speedeedelivery.com/track-a-shipment/?trackingNumber="+n; }},
                        { key:"SPEEDEE",      fn:function(n){ return "https://speedeedelivery.com/track-a-shipment/?trackingNumber="+n; }},
                        { key:"SPEED-DEE",    fn:function(n){ return "https://speedeedelivery.com/track-a-shipment/?trackingNumber="+n; }}
                    ];
                    function getITrackUrl(carrier, num) {
                        var cu = (carrier||"").toUpperCase();
                        for (var i=0;i<CARRIERS.length;i++) {
                            if (cu.indexOf(CARRIERS[i].key)>-1) return CARRIERS[i].fn(num);
                        }
                        return null;
                    }

                    var url = getITrackUrl(m.carrier, m.tracking);
                    var card = el("div","border:1.5px solid #dde;border-radius:12px;padding:12px;margin-bottom:10px;background:#fafafa");

                    var cRow = el("div","font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:8px");
                    cRow.textContent = "🚛  " + (m.carrier || "Unknown Carrier");
                    card.appendChild(cRow);

                    if (url) {
                        var a = el("a","font-size:15px;font-weight:700;color:#1565c0;text-decoration:underline;word-break:break-all;display:block;margin-bottom:4px");
                        a.textContent = m.tracking; a.href = url; a.target = "_blank";
                        card.appendChild(a);
                        lines.push((m.carrier||"Carrier") + ": " + m.tracking);
                        lines.push(url);
                    } else {
                        var sp = el("span","font-size:15px;font-weight:700;color:#333;word-break:break-all;display:block;margin-bottom:2px;user-select:all");
                        sp.textContent = m.tracking; card.appendChild(sp);
                        var note = el("div","font-size:11px;color:#999;margin-bottom:4px");
                        note.textContent = "Tap and hold to copy"; card.appendChild(note);
                        lines.push((m.carrier||"Carrier") + ": " + m.tracking);
                    }

                    if (m.inv) {
                        var meta3 = el("div","font-size:12px;color:#888");
                        meta3.textContent = "Invoice #" + m.inv + (m.ord ? "  · Order #" + m.ord : "");
                        card.appendChild(meta3);
                    }
                    iTrackDiv.appendChild(card);
                } else {
                    var noTrk = el("div","padding:20px;text-align:center;font-size:13px;color:#888");
                    noTrk.textContent = "No tracking number found on this invoice.";
                    iTrackDiv.appendChild(noTrk);
                }

                iTrackDiv._textLines = lines;
            }

            /* ── Mode switcher ── */
            function setIMode(mode) {
                curIMode = mode;
                IMODES.forEach(function (m2) {
                    var b = iSegBtns[m2.key];
                    if (m2.key === mode) { b.style.background = "#1a1a2e"; b.style.color = "#fff"; }
                    else                 { b.style.background = "#fff";    b.style.color = "#1a1a2e"; }
                });

                iHint.textContent =
                    mode === "rma"      ? "Check items to return — select a reason for each" :
                    mode === "tech"     ? "Check items needing Tech Help" :
                                          "Shipment tracking info for this invoice";

                if (mode === "tracking") {
                    iList.style.display        = "none";
                    iTrackDiv.style.display    = "";
                    iBtnCopy.style.display     = "";
                    iBtnOutlook.style.display  = "";
                    if (!iTrackDiv._textLines) buildITrackingPanel();
                    iBtnOk.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;' +
                        'width:18px;height:18px;background:#25d366;border-radius:4px;' +
                        'font-size:12px;line-height:1;margin-right:5px;">💬</span>Text To';
                } else {
                    iList.style.display        = "";
                    iTrackDiv.style.display    = "none";
                    iBtnCopy.style.display     = "none";
                    iBtnOutlook.style.display  = "none";
                    /* reset RMA dropdowns and qty inputs if switching away */
                    qsa("input[type=checkbox]", iList).forEach(function (c) {
                        if (!c._sel) return;
                        if (mode === "rma" && c.checked) {
                            c._sel.style.display   = "block";
                            if (c._qtyIn) c._qtyIn.style.display = "inline-block";
                        } else {
                            c._sel.style.display   = "none";
                            c._sel.value = "";
                            if (c._qtyIn) { c._qtyIn.style.display = "none"; c._qtyIn.value = c._item.qt; }
                        }
                    });
                    iBtnOk.textContent =
                        mode === "rma"  ? "📦  Create RMA Email" :
                                          "🔧  Send Tech Help Email";
                }
            }

            /* ── Copy button ── */
            iBtnCopy.addEventListener("click", function () {
                var lines = iTrackDiv._textLines || [];
                if (!lines.length) { alert("No tracking info to copy."); return; }
                copyText(lines.join("\n").trim(), function () {
                    iBtnCopy.textContent = "✓ Copied!";
                    setTimeout(function () { iBtnCopy.textContent = "📋 Copy"; }, 2000);
                });
            });

            iBtnOutlook.addEventListener("click", function () {
                var q = m.ord || m.inv || "";
                if (!q) { alert("No order/invoice number found."); return; }
                copyText(q, function () {
                    alert("Order number copied!\nPaste to search in Outlook.");
                    location.href = "ms-outlook://search";
                }, function () {
                    alert("Order number copied!\nPaste to search in Outlook.");
                    location.href = "ms-outlook://search";
                });
            });

            /* ── Primary button ── */
            iBtnOk.addEventListener("click", function () {
                var im = invMeta(); /* re-read in case page loaded async */

                if (curIMode === "tracking") {
                    var lines = iTrackDiv._textLines || [];
                    if (!lines.length) { alert("No tracking info loaded yet."); return; }
                    var body2 = lines.join("\n").trim();
                    var sms = /ipad|iphone|ipod/i.test(navigator.userAgent)
                        ? "sms:&body=" + encodeURIComponent(body2)
                        : "sms:?body=" + encodeURIComponent(body2);
                    location.href = sms;
                    return;
                }

                var checked = qsa("input[type=checkbox]:checked", iList);
                if (!checked.length) { alert("Select at least one item."); return; }

                var pns = checked.map(function (c) { return c._item.pn; });

                if (curIMode === "tech") {
                    p.close();
                    compose(
                        "smatechs@smalink.com",
                        pns.length === 1
                            ? "Tech Help For " + pns[0]
                            : "Tech Help For " + pns.join(", "),
                        "Tech Help Needed for the following parts:\n\n" + pns.join("\n") + "\n\n" +
                        "Invoice #" + im.inv + "  |  " + im.name
                    );
                    return;
                }

                /* RMA */
                var lines2 = checked.map(function (c) {
                    var q   = (c._qtyIn && c._qtyIn.value) ? c._qtyIn.value : c._item.qt;
                    var rsn = c._sel && c._sel.value ? " — " + c._sel.value : "";
                    return q + " — " + c._item.pn + " — " + c._item.sd + rsn;
                });
                p.close();
                compose(
                    "smareturns@smalink.com",
                    "RMA for " + im.name,
                    "RMA for " + im.name +
                    "\nInvoice Number: " + im.inv +
                    (im.ord ? "\nOrder Number: " + im.ord : "") +
                    "\n\n" + lines2.join("\n") +
                    "\n\nPlease email me any return paperwork and call tags as needed."
                );
            });

            iBtnCa.addEventListener("click", p.close);

            buildIList();
            setIMode("rma");
        }

        if (PAGE.isInvoice) {
            pageActions.push(
                { label: "🧾  Invoice RMA / Tech / Tracking", fn: invoiceAction }
            );
        }

        if (PAGE.isItem || PAGE.isItemDetail) {
            pageActions.push(
                { label: "⏱  ETA Email", fn: etaAction }
            );
            pageActions.push({
                label: "🔧  Tech Help Email",
                fn: function () {
                    var pn = detectPN();
                    if (!pn) pn = prompt("Part Number:", "");
                    if (!pn) return;
                    compose(
                        "smatechs@smalink.com",
                        "Tech Help For " + pn,
                        "Tech Help Needed for " + pn + "\n\n"
                    );
                }
            });
        }

        /* ── Friendly "wrong page" panel with a tappable link ── */
        function wrongPage(title, reason, instructions, url, linkLabel) {
            var p   = makePanel("⚠️  " + title);
            var pan = p.panel;

            var body = el("div", S.scroll + ";padding:18px 16px");

            var icon = el("div",
                "font-size:42px;text-align:center;margin-bottom:12px");
            icon.textContent = "🗺️";
            body.appendChild(icon);

            var msg = el("div",
                "font-size:14px;color:#333;text-align:center;margin-bottom:10px;" +
                "font-weight:600;line-height:1.4");
            msg.textContent = reason;
            body.appendChild(msg);

            var inst = el("div",
                "font-size:13px;color:#666;text-align:center;margin-bottom:18px;" +
                "line-height:1.5");
            inst.textContent = instructions;
            body.appendChild(inst);

            var goBtn = el("button",
                "display:block;width:100%;min-height:48px;padding:12px;font-size:15px;" +
                "font-weight:700;border:none;border-radius:12px;background:#1a1a2e;" +
                "color:#fff;cursor:pointer;margin-bottom:8px");
            goBtn.textContent = "🔗  " + linkLabel;
            goBtn.addEventListener("click", function () {
                p.close();
                location.href = url;
            });
            body.appendChild(goBtn);

            pan.appendChild(body);

            var foot = el("div", S.foot);
            var bCa  = el("button", S.btnDanger); bCa.textContent = "Cancel";
            bCa.addEventListener("click", p.close);
            foot.appendChild(bCa);
            pan.sealFooter(foot);
        }

        /* ── Load an external script once, then call an optional entry fn ── */
        function loadScript(url, onload) {
            var s = document.createElement("script");
            s.src = url + "?" + Date.now();
            s.onload = function () { if (onload) onload(); };
            s.onerror = function () { alert("Could not load script:\n" + url); };
            document.body.appendChild(s);
        }

        if (PAGE.isLiterature) {
            pageActions.push(
                { label: "📚  Literature Request", fn: literatureRequest }
            );
        }

        if (PAGE.isNewsletterProduct) {
            pageActions.push(
                { label: "📰  Create Newsletter", fn: function () {
                    var u = location.href.toLowerCase();
                    var onValidPage = u.indexOf("smalink.com/documents")      > -1 ||
                                     u.indexOf("smalink.com/m/catalogs/7")   > -1;
                    if (!onValidPage) {
                        wrongPage(
                            "Create Newsletter",
                            "The newsletter builder needs the full catalog to work properly.",
                            "Please navigate to the Documents page or the catalog page first, then tap Create Newsletter again.",
                            "https://www.smalink.com/Documents",
                            "Go to Documents Page"
                        );
                        return;
                    }
                    loadScript("https://wildref.us/tools/newsletter.js", function () {
                        if (window.newsletterBuilder) window.newsletterBuilder();
                        else alert("newsletter.js loaded but newsletterBuilder() not found.");
                    });
                }},
                { label: "📋  Add Products to Newsletter Queue", fn: function () {
                    loadScript("https://wildref.us/tools/newsletter_products.js");
                }}
            );
        }

        if (PAGE.isSalesRep) {
            pageActions.push({ label: "📈  Sales Rep Summary", fn: chartData });
        }

        if (PAGE.isCRM) {
            pageActions.push({
                label: "📋  Load CRM Meetings (New UI)",
                fn: function () { showCRMPanel(); }
            });
            pageActions.push({
                label: "📋  Load CRM Meetings (Classic)",
                fn: function () { showCRMClassic(); }
            });
        }

        if (PAGE.isRemote) {
            pageActions.push(
                { label: "📊  Order Viewer", fn: orderViewer }
            );
        }


        /* ============================================================
           CRM CLASSIC  — original prompt-based version
        ============================================================ */
        function showCRMClassic() {
            (async function() {
                function s(t){return new Promise(function(r){setTimeout(r,t);})}
                function pad2(n){return(n<10?"0":"")+n;}
                function fmtMDY(d){return pad2(d.getMonth()+1)+"/"+pad2(d.getDate())+"/"+d.getFullYear();}
                function fmtWP(d){var m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];return m+" "+d.getDate()+", "+d.getFullYear();}
                function parseMDY(x){x=(x||"").trim();var m=x.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);if(!m)return null;var mm=+m[1],dd=+m[2],yy=+m[3];if(yy<100)yy+=2000;var d=new Date(yy,mm-1,dd,12,0,0,0);if(d.getMonth()!==mm-1||d.getDate()!==dd)return null;return d;}
                function mondayOfLastWeek(){var n=new Date();n.setHours(12,0,0,0);var dow=n.getDay();var mon=new Date(n);mon.setDate(n.getDate()-(dow===0?6:dow-1));var lm=new Date(mon);lm.setDate(mon.getDate()-7);return lm;}
                function allDocs(){var out=[{d:document,w:window}];document.querySelectorAll("iframe").forEach(function(f){try{var w=f.contentWindow;var d=f.contentDocument||w.document;if(d&&w)out.push({d:d,w:w});}catch(e){}});return out;}
                function findFormCtx(){var docs=allDocs();for(var i=0;i<docs.length;i++){var d=docs[i].d;if(d.getElementById("ctl01_CompanyContactSelection1_tkAccount")||d.getElementById("ctl01_btnAdd"))return docs[i];}return allDocs()[0];}
                function hideDP(ctx){try{var dp=ctx.d.getElementById("ui-datepicker-div")||document.getElementById("ui-datepicker-div");if(dp)dp.style.display="none";}catch(e){}}
                function setv(ctx,el,v){if(!el)return false;el.focus();el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));el.blur();hideDP(ctx);return true;}
                function setCompleted(ctx){var sel=ctx.d.getElementById("ctl01_StatusCode_Selection1_ddlStatusCode");if(sel){sel.value="1";sel.dispatchEvent(new Event("change",{bubbles:true}));}}
                async function waitAny(fn,ms,step){var t=Date.now();step=step||250;while(Date.now()-t<ms){var v=null;try{v=fn();}catch(e){}if(v)return v;await s(step);}return null;}
                function norm(t){return(t||"").replace(/\s+/g," ").trim();}
                async function selectAccount(ctx,acct){
                    var d=ctx.d;
                    var inp=d.getElementById("token-input-ctl01_CompanyContactSelection1_tkAccount")||
                        d.querySelector('#ctl01_CompanyContactSelection1_divExternalLookup input[type="text"][autocomplete="wp-off"]');
                    if(!inp)throw new Error("Account input not found");
                    inp.focus();inp.value="";inp.dispatchEvent(new Event("input",{bubbles:true}));
                    await s(120);inp.value=acct;inp.dispatchEvent(new Event("input",{bubbles:true}));
                    await s(650);
                    await waitAny(function(){return d.getElementById("WPDropdown_ctl01_CompanyContactSelection1_tkAccount");},12000);
                    for(var tries=0;tries<80;tries++){
                        await s(250);
                        var dd=d.getElementById("WPDropdown_ctl01_CompanyContactSelection1_tkAccount");
                        var items=dd?[...dd.querySelectorAll("li")]:[];
                        if(!items.length)continue;
                        var shipRe=new RegExp("\\[100-\\d+-"+acct+"\\]");
                        var billRe=new RegExp("\\[100-"+acct+"\\]");
                        var ship=items.find(function(li){return shipRe.test(norm(li.textContent));});
                        var bill=items.find(function(li){return billRe.test(norm(li.textContent));});
                        var pick=ship||bill||items.find(function(li){return norm(li.textContent).includes(acct);});
                        if(pick){try{pick.scrollIntoView({block:"nearest"});}catch(e){}
                            pick.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}));
                            pick.dispatchEvent(new MouseEvent("mouseup",{bubbles:true}));
                            pick.dispatchEvent(new MouseEvent("click",{bubbles:true}));
                            try{pick.click();}catch(e){}await s(700);return true;}
                    }
                    throw new Error("No selectable account "+acct);
                }
                async function clickOK(ctx){var b=ctx.d.getElementById("ctl01_btnAdd");if(!b)throw new Error("OK button not found");b.click();}
                async function clickAddAnother(){
                    var hit=await waitAny(function(){var docs=allDocs();for(var i=0;i<docs.length;i++){var d=docs[i].d;var a=d&&d.getElementById?d.getElementById("ctl01_btnReset"):null;if(!a&&d&&d.querySelectorAll)a=[...d.querySelectorAll("a")].find(function(x){return x&&/add another meeting/i.test(x.textContent||"");})||null;if(a)return{ctx:docs[i],el:a};}return null;},90000,400);
                    if(!hit)throw new Error("Add another meeting not found");
                    var ctx=hit.ctx,a=hit.el;await s(800);
                    try{a.scrollIntoView({block:"center"});}catch(e){}await s(250);
                    try{if(ctx.w&&typeof ctx.w.__doPostBack==="function"){ctx.w.__doPostBack("ctl01$btnReset","");return true;}}catch(e){}
                    try{a.click();}catch(e){}await s(900);return true;
                }
                function dateKey(d){return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());}
                function parseSkipDates(raw){raw=String(raw||"").trim();if(!raw)return new Set();var toks=raw.split(/[\s,;]+/).filter(Boolean);var set=new Set();for(var i=0;i<toks.length;i++){var d=parseMDY(toks[i]);if(d)set.add(dateKey(d));}return set;}
                function isBlocked(d,skip){var dow=d.getDay();if(dow===5||dow===6||dow===0)return true;return skip&&skip.has(dateKey(d));}
                function nextAllowedDay(d,skip){var x=new Date(d);x.setHours(12,0,0,0);while(isBlocked(x,skip))x.setDate(x.getDate()+1);return x;}

                var raw=prompt("Paste up to 12 six-digit account numbers (any format):","");
                if(raw===null)return;
                var accts=(String(raw).match(/[0-9]{6}/g)||[]).map(function(x){return x.trim();}).filter(Boolean).slice(0,12);
                if(!accts.length){alert("No 6-digit accounts were found.");return;}
                var defMon=mondayOfLastWeek();
                var startStr=prompt("Enter START date (MM/DD/YYYY). Blank = Monday of last week ("+fmtMDY(defMon)+"):","");
                if(startStr===null)return;
                var base=parseMDY(startStr)||defMon;
                var skipRaw=prompt("Optional: Skip dates (MM/DD/YYYY). Separate by space or comma.","");
                if(skipRaw===null)return;
                var skip=parseSkipDates(skipRaw);
                var perDay=3;var day=nextAllowedDay(base,skip);var used=0;
                for(var i=0;i<accts.length;i++){
                    if(i>0&&i%perDay===0){day.setDate(day.getDate()+1);day=nextAllowedDay(day,skip);}
                    var ctx=findFormCtx();var ds=fmtWP(day);
                    setv(ctx,ctx.d.getElementById("ctl01_dtStartDate"),ds);
                    setv(ctx,ctx.d.getElementById("ctl01_dtEndDate"),ds);
                    setCompleted(ctx);
                    await selectAccount(ctx,accts[i]);
                    await s(400);await clickOK(ctx);await s(2600);await clickAddAnother();await s(1600);used++;
                }
                alert("Done: added "+used+" meeting(s).");
            })();
        }

        /* ============================================================
           CRM PANEL  — full UI version
        ============================================================ */
        function showCRMPanel() {
            function _s(t){return new Promise(function(r){setTimeout(r,t);})}
            function _pad2(n){return(n<10?"0":"")+n;}
            function _fmtWP(d){var m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];return m+" "+d.getDate()+", "+d.getFullYear();}
            function _fmtMDY(d){return _pad2(d.getMonth()+1)+"/"+_pad2(d.getDate())+"/"+d.getFullYear();}
            function _dateKey(d){return d.getFullYear()+"-"+_pad2(d.getMonth()+1)+"-"+_pad2(d.getDate());}
            function _mondayLastWeek(){var n=new Date();n.setHours(12,0,0,0);var dow=n.getDay();var mon=new Date(n);mon.setDate(n.getDate()-(dow===0?6:dow-1));var lm=new Date(mon);lm.setDate(mon.getDate()-7);return lm;}
            function _allDocs(){var out=[{d:document,w:window}];document.querySelectorAll("iframe").forEach(function(f){try{var w=f.contentWindow;var d=f.contentDocument||w.document;if(d&&w)out.push({d:d,w:w});}catch(e){}});return out;}
            function _findCtx(){var docs=_allDocs();for(var i=0;i<docs.length;i++){var d=docs[i].d;if(d.getElementById("ctl01_CompanyContactSelection1_tkAccount")||d.getElementById("ctl01_btnAdd"))return docs[i];}return _allDocs()[0];}
            function _hideDP(ctx){try{var dp=ctx.d.getElementById("ui-datepicker-div")||document.getElementById("ui-datepicker-div");if(dp)dp.style.display="none";}catch(e){}}
            function _setv(ctx,el,v){if(!el)return false;el.focus();el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));el.blur();_hideDP(ctx);return true;}
            function _setCompleted(ctx){var sel=ctx.d.getElementById("ctl01_StatusCode_Selection1_ddlStatusCode");if(sel){sel.value="1";sel.dispatchEvent(new Event("change",{bubbles:true}));}}
            function _norm(t){return(t||"").replace(/\s+/g," ").trim();}
            async function _waitAny(fn,ms,step){var t=Date.now();step=step||250;while(Date.now()-t<ms){var v=null;try{v=fn();}catch(e){}if(v)return v;await _s(step);}return null;}
            async function _selectAccount(ctx,acct){
                var d=ctx.d;
                var inp=d.getElementById("token-input-ctl01_CompanyContactSelection1_tkAccount")||
                    d.querySelector('#ctl01_CompanyContactSelection1_divExternalLookup input[type="text"][autocomplete="wp-off"]');
                if(!inp)throw new Error("Account input not found");
                inp.focus();inp.value="";inp.dispatchEvent(new Event("input",{bubbles:true}));
                await _s(120);inp.value=acct;inp.dispatchEvent(new Event("input",{bubbles:true}));
                await _s(650);
                await _waitAny(function(){return d.getElementById("WPDropdown_ctl01_CompanyContactSelection1_tkAccount");},12000);
                for(var tries=0;tries<80;tries++){
                    await _s(250);
                    var dd=d.getElementById("WPDropdown_ctl01_CompanyContactSelection1_tkAccount");
                    var items=dd?[...dd.querySelectorAll("li")]:[];
                    if(!items.length)continue;
                    var shipRe=new RegExp("\\[100-\\d+-"+acct+"\\]");
                    var billRe=new RegExp("\\[100-"+acct+"\\]");
                    var ship=items.find(function(li){return shipRe.test(_norm(li.textContent));});
                    var bill=items.find(function(li){return billRe.test(_norm(li.textContent));});
                    var pick=ship||bill||items.find(function(li){return _norm(li.textContent).includes(acct);});
                    if(pick){try{pick.scrollIntoView({block:"nearest"});}catch(e){}
                        pick.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}));
                        pick.dispatchEvent(new MouseEvent("mouseup",{bubbles:true}));
                        pick.dispatchEvent(new MouseEvent("click",{bubbles:true}));
                        try{pick.click();}catch(e){}await _s(700);return true;}
                }
                throw new Error("No selectable account "+acct);
            }
            async function _clickOK(ctx,testMode){if(testMode){return true;}var b=ctx.d.getElementById("ctl01_btnAdd");if(!b)throw new Error("OK button not found");b.click();}
            async function _clickAddAnother(){
                var hit=await _waitAny(function(){var docs=_allDocs();for(var i=0;i<docs.length;i++){var d=docs[i].d;var a=d&&d.getElementById?d.getElementById("ctl01_btnReset"):null;if(!a&&d&&d.querySelectorAll)a=[...d.querySelectorAll("a")].find(function(x){return x&&/add another meeting/i.test(x.textContent||"");})||null;if(a)return{ctx:docs[i],el:a};}return null;},90000,400);
                if(!hit)throw new Error("Add another meeting not found");
                var ctx=hit.ctx,a=hit.el;await _s(800);
                try{a.scrollIntoView({block:"center"});}catch(e){}await _s(250);
                try{if(ctx.w&&typeof ctx.w.__doPostBack==="function"){ctx.w.__doPostBack("ctl01$btnReset","");return true;}}catch(e){}
                try{a.click();}catch(e){}await _s(900);return true;
            }

            var defDate=_mondayLastWeek();
            var ov=el("div","position:fixed;inset:0;background:rgba(15,23,42,.75);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:system-ui;padding:12px");
            var box=el("div","background:#fff;border-radius:14px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)");
            var hdr=el("div","background:#1a1a2e;color:#fff;padding:13px 16px;border-radius:14px 14px 0 0;display:flex;align-items:center;justify-content:space-between");
            var htitle=el("div","font-weight:800;font-size:15px"); htitle.textContent="\uD83D\uDCCB  Load CRM Meetings";
            var hclose=el("button","background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 4px;line-height:1"); hclose.textContent="\u2715";
            hclose.onclick=function(){document.body.removeChild(ov);};
            hdr.appendChild(htitle);hdr.appendChild(hclose);box.appendChild(hdr);
            var body=el("div","padding:16px;display:flex;flex-direction:column;gap:12px");

            function secLbl(txt){var d=el("div","font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:2px");d.textContent=txt;return d;}
            function mkInp(ph,val){var i=el("input","width:100%;height:38px;padding:0 10px;font-size:13px;border:1.5px solid #d1d5db;border-radius:8px;outline:none;box-sizing:border-box;background:#fafafa");i.placeholder=ph||"";i.value=val||"";return i;}

            /* Account numbers */
            var acctWrap=el("div",""); acctWrap.appendChild(secLbl("Account Numbers"));
            var acctHint=el("div","font-size:11px;color:#9ca3af;margin-bottom:4px"); acctHint.textContent="Paste any number of 6-digit account numbers";
            var acctTA=el("textarea","width:100%;height:80px;padding:8px 10px;font-size:13px;border:1.5px solid #d1d5db;border-radius:8px;outline:none;box-sizing:border-box;background:#fafafa;resize:vertical;font-family:monospace");
            acctTA.placeholder="123456 234567 345678\nor one per line...";
            var acctCount=el("div","font-size:11px;color:#6b7280;margin-top:4px;font-weight:600"); acctCount.textContent="0 accounts detected";
            function getAccts(){return(acctTA.value.match(/[0-9]{6}/g)||[]).map(function(x){return x.trim();}).filter(function(v,i,a){return a.indexOf(v)===i;});}
            acctTA.addEventListener("input",function(){var a=getAccts();acctCount.textContent=a.length+" account"+(a.length!==1?"s":"")+" detected";acctCount.style.color=a.length?"#16a34a":"#6b7280";buildSchedule(a.length,false);});
            acctWrap.appendChild(acctHint);acctWrap.appendChild(acctTA);acctWrap.appendChild(acctCount);body.appendChild(acctWrap);

            /* Start date */
            var dateWrap=el("div",""); dateWrap.appendChild(secLbl("Start Date"));
            var dateInp=mkInp("MM/DD/YYYY",""); dateInp.type="date";
            dateInp.value=defDate.getFullYear()+"-"+_pad2(defDate.getMonth()+1)+"-"+_pad2(defDate.getDate());
            dateInp.addEventListener("change",function(){buildSchedule(getAccts().length,true);});
            dateWrap.appendChild(dateInp); body.appendChild(dateWrap);

            /* Skip dates */
            var skipWrap=el("div",""); skipWrap.appendChild(secLbl("Skip Dates (optional)"));
            var skipHint=el("div","font-size:11px;color:#9ca3af;margin-bottom:6px"); skipHint.textContent="Pick holidays or days off to exclude.";
            skipWrap.appendChild(skipHint);
            var skipPickRow=el("div","display:flex;gap:6px;align-items:center;margin-bottom:6px");
            var skipPicker=el("input","height:34px;padding:0 8px;font-size:13px;border:1.5px solid #d1d5db;border-radius:8px;outline:none;background:#fafafa;flex:1");
            skipPicker.type="date";
            var skipAddBtn=el("button","height:34px;padding:0 12px;font-size:13px;font-weight:700;border:none;border-radius:8px;background:#1a1a2e;color:#fff;cursor:pointer;white-space:nowrap");
            skipAddBtn.textContent="+ Add";
            skipPickRow.appendChild(skipPicker);skipPickRow.appendChild(skipAddBtn);skipWrap.appendChild(skipPickRow);
            var skipTags=el("div","display:flex;flex-wrap:wrap;gap:5px;min-height:28px");
            skipWrap.appendChild(skipTags); body.appendChild(skipWrap);
            var skipDates=[];
            function getSkipSet(){var s=new Set();skipDates.forEach(function(d){s.add(_dateKey(d));});return s;}
            function renderSkipTags(){skipTags.innerHTML="";skipDates.forEach(function(d,i){var tag=el("div","display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:#fef3c7;border:1px solid #fcd34d;border-radius:20px;font-size:12px;font-weight:700;color:#92400e");tag.textContent=_fmtMDY(d);var rm=el("button","background:none;border:none;cursor:pointer;color:#92400e;font-size:14px;padding:0;line-height:1;margin-left:2px");rm.textContent="\u00d7";rm.onclick=function(){skipDates.splice(i,1);renderSkipTags();buildSchedule(getAccts().length,true);};tag.appendChild(rm);skipTags.appendChild(tag);});}
            skipAddBtn.addEventListener("click",function(){var v=skipPicker.value;if(!v)return;var d=new Date(v+"T12:00:00");var key=_dateKey(d);if(skipDates.some(function(x){return _dateKey(x)===key;})){skipPicker.value="";return;}skipDates.push(d);skipDates.sort(function(a,b){return a-b;});skipPicker.value="";renderSkipTags();buildSchedule(getAccts().length,true);});
            skipPicker.addEventListener("keydown",function(e){if(e.key==="Enter")skipAddBtn.click();});

            /* Options: Friday + default per day */
            var optRow=el("div","display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:2px");
            var friWrap=el("label","display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#1a1a2e;cursor:pointer;padding:6px 10px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:8px");
            var friCb=el("input","width:16px;height:16px;cursor:pointer;accent-color:#16a34a"); friCb.type="checkbox";friCb.checked=false;
            friWrap.appendChild(friCb);friWrap.appendChild(document.createTextNode("Include Fridays"));
            friCb.addEventListener("change",function(){buildSchedule(getAccts().length,true);});
            var defDayWrap=el("div","display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px");
            var defDayLbl=el("div","font-size:13px;font-weight:700;color:#1a1a2e;white-space:nowrap"); defDayLbl.textContent="Default per day:";
            var defDayInp=el("input","width:52px;height:30px;text-align:center;font-size:14px;font-weight:800;border:1.5px solid #d1d5db;border-radius:6px;outline:none;background:#fff");
            defDayInp.type="number";defDayInp.min="1";defDayInp.max="30";defDayInp.value="3";
            defDayInp.addEventListener("change",function(){buildSchedule(getAccts().length,true);});
            defDayWrap.appendChild(defDayLbl);defDayWrap.appendChild(defDayInp);
            optRow.appendChild(friWrap);optRow.appendChild(defDayWrap);

            /* Schedule section */
            var schedSection=el("div","");
            schedSection.appendChild(secLbl("Schedule \u2014 Accounts Per Day"));
            schedSection.appendChild(optRow);
            var schedHint2=el("div","font-size:11px;color:#9ca3af;margin:4px 0 6px"); schedHint2.textContent="Each row is a day. Uncheck to skip, adjust count per day.";
            schedSection.appendChild(schedHint2);
            var schedGrid=el("div","display:flex;flex-direction:column;gap:5px");
            schedSection.appendChild(schedGrid); body.appendChild(schedSection);

            var dayRows=[];
            var DAYS=["","Mon","Tue","Wed","Thu","Fri","","Sun"];

            function _nextDay(d,skip){var x=new Date(d);x.setHours(12,0,0,0);while(true){var dow=x.getDay();if(dow===0||dow===6){x.setDate(x.getDate()+1);continue;}if(dow===5&&!friCb.checked){x.setDate(x.getDate()+1);continue;}if(skip&&skip.has(_dateKey(x))){x.setDate(x.getDate()+1);continue;}break;}return x;}

            function makeRow(dayDate,perDef){var dow=dayDate.getDay();var isFri=dow===5;var row=el("div","display:flex;align-items:center;gap:8px;padding:7px 10px;background:"+(isFri?"#fefce8":"#f9fafb")+";border-radius:8px;border:1px solid "+(isFri?"#fef08a":"#e5e7eb"));var cb=el("input","width:16px;height:16px;cursor:pointer;accent-color:#1a1a2e");cb.type="checkbox";cb.checked=true;var lbl=el("div","font-size:13px;font-weight:700;min-width:96px;color:"+(isFri?"#854d0e":"#1a1a2e"));lbl.textContent=DAYS[dow]+" "+_fmtMDY(dayDate)+(isFri?" \uD83D\uDFE1":"");var cntInp=el("input","width:52px;height:30px;text-align:center;font-size:13px;font-weight:700;border:1.5px solid #d1d5db;border-radius:6px;outline:none;background:#fff");cntInp.type="number";cntInp.min="1";cntInp.max="30";cntInp.value=String(perDef);var cntLbl=el("div","font-size:11px;color:#6b7280");cntLbl.textContent="accts";cb.addEventListener("change",function(){row.style.opacity=cb.checked?"1":".45";cntInp.disabled=!cb.checked;updateSummary();});row.appendChild(cb);row.appendChild(lbl);row.appendChild(cntInp);row.appendChild(cntLbl);schedGrid.appendChild(row);dayRows.push({date:dayDate,cb:cb,countInp:cntInp});}

            function buildSchedule(totalAccts,forceRebuild){var skipSet=getSkipSet();var perDef=parseInt(defDayInp.value)||3;if(forceRebuild||!dayRows.length){schedGrid.innerHTML="";dayRows=[];var startVal=dateInp.value;var base=startVal?new Date(startVal+"T12:00:00"):defDate;var needed=Math.max(1,Math.ceil((totalAccts||0)/perDef));if(needed>20)needed=20;var cur=_nextDay(base,skipSet);for(var d=0;d<needed;d++){makeRow(cur,perDef);var nx=new Date(cur);nx.setDate(nx.getDate()+1);cur=_nextDay(nx,skipSet);}updateSummary();return;}var totalSlots=0;dayRows.forEach(function(r){if(r.cb.checked)totalSlots+=parseInt(r.countInp.value)||0;});if(totalSlots>=totalAccts){updateSummary();return;}var last=dayRows[dayRows.length-1].date;var nx2=new Date(last);nx2.setDate(nx2.getDate()+1);var cur2=_nextDay(nx2,skipSet);var safety=0;while(totalSlots<totalAccts&&safety<20){makeRow(cur2,perDef);totalSlots+=perDef;var nx3=new Date(cur2);nx3.setDate(nx3.getDate()+1);cur2=_nextDay(nx3,skipSet);safety++;}updateSummary();}

            /* Summary */
            var summaryBox=el("div","padding:10px 12px;background:#eef2fb;border-radius:8px;border:1.5px solid #bfdbfe;font-size:12px;color:#1e40af;font-weight:600");
            summaryBox.textContent="Paste account numbers to see schedule."; body.appendChild(summaryBox);

            function updateSummary(){var accts=getAccts();var total=0;dayRows.forEach(function(r){if(r.cb.checked)total+=parseInt(r.countInp.value)||0;});var needed=accts.length;var ok=total>=needed;summaryBox.textContent=needed+" account"+(needed!==1?"s":"")+" across "+dayRows.filter(function(r){return r.cb.checked;}).length+" day"+(dayRows.filter(function(r){return r.cb.checked;}).length!==1?"s":"")+" ("+total+" slots)"+(ok?"":" \u2014 \u26a0\ufe0f need "+(needed-total)+" more slots");summaryBox.style.borderColor=ok?"#bfdbfe":"#fca5a5";summaryBox.style.background=ok?"#eef2fb":"#fef2f2";summaryBox.style.color=ok?"#1e40af":"#991b1b";}

            schedGrid.addEventListener("input",function(){updateSummary();});

            /* Random comments */
            var commentSection=el("div","");
            var commentToggleRow=el("label","display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 12px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:8px;font-size:13px;font-weight:700;color:#0369a1");
            var commentCb=el("input","width:17px;height:17px;cursor:pointer;accent-color:#0369a1"); commentCb.type="checkbox";commentCb.checked=false;
            commentToggleRow.appendChild(commentCb);commentToggleRow.appendChild(document.createTextNode("\uD83D\uDCAC  Random Visit Comments"));
            commentSection.appendChild(commentToggleRow);
            var commentBody=el("div","display:none;margin-top:8px;padding:10px 12px;background:#f8fafc;border:1.5px solid #bae6fd;border-radius:8px");
            var commentHint=el("div","font-size:11px;color:#6b7280;margin-bottom:6px;line-height:1.5"); commentHint.textContent="Up to 6 comments, one per line. A random one is picked for each meeting.";
            commentBody.appendChild(commentHint);
            var commentTA=el("textarea","width:100%;height:110px;padding:8px 10px;font-size:12px;line-height:1.6;border:1.5px solid #d1d5db;border-radius:8px;outline:none;background:#fff;resize:vertical;font-family:system-ui;box-sizing:border-box");
            commentTA.placeholder="Visited customer and reviewed product line.\nDiscussed upcoming promotions and pricing.\nChecked inventory levels and placed follow-up order.\nIntroduced new seasonal specials.\nConducted product knowledge review.\nCollected feedback on recent orders.";
            commentBody.appendChild(commentTA);
            var commentCount=el("div","font-size:11px;color:#6b7280;margin-top:4px;font-weight:600"); commentCount.textContent="0 comments";
            function getComments(){return commentTA.value.split("\n").map(function(l){return l.trim();}).filter(function(l){return l.length>0;}).slice(0,6);}
            commentTA.addEventListener("input",function(){var c=getComments();commentCount.textContent=c.length+" comment"+(c.length!==1?"s":"")+" (max 6)";commentCount.style.color=c.length>=6?"#16a34a":"#6b7280";});
            commentBody.appendChild(commentCount); commentSection.appendChild(commentBody); body.appendChild(commentSection);
            commentCb.addEventListener("change",function(){commentBody.style.display=commentCb.checked?"block":"none";});

            /* All Day + Sync */
            var optionsRow=el("div","display:flex;gap:8px;flex-wrap:wrap");
            var allDayWrap=el("label","display:flex;align-items:center;gap:7px;cursor:pointer;padding:8px 12px;background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:8px;font-size:13px;font-weight:700;color:#5b21b6;flex:1;white-space:nowrap");
            var allDayCb=el("input","width:17px;height:17px;cursor:pointer;accent-color:#7c3aed"); allDayCb.type="checkbox";allDayCb.checked=false;
            allDayWrap.appendChild(allDayCb);allDayWrap.appendChild(document.createTextNode("\uD83D\uDDD3  All Day Event"));
            var syncWrap=el("label","display:flex;align-items:center;gap:7px;cursor:pointer;padding:8px 12px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;font-size:13px;font-weight:700;color:#1d4ed8;flex:1;white-space:nowrap");
            var syncCb=el("input","width:17px;height:17px;cursor:pointer;accent-color:#2563eb"); syncCb.type="checkbox";syncCb.checked=false;
            syncWrap.appendChild(syncCb);syncWrap.appendChild(document.createTextNode("\u2601\uFE0F  Sync Office 365"));
            optionsRow.appendChild(allDayWrap);optionsRow.appendChild(syncWrap); body.appendChild(optionsRow);

            /* Test mode */
            var testRow=el("div","display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff7ed;border-radius:8px;border:1.5px solid #fed7aa");
            var testCb=el("input","width:18px;height:18px;cursor:pointer;accent-color:#ea580c"); testCb.type="checkbox";testCb.checked=false;
            var testLbl=el("div","font-size:13px;font-weight:700;color:#9a3412"); testLbl.textContent="\uD83E\uDDEA Test Mode \u2014 fills form but does NOT submit";
            testRow.appendChild(testCb);testRow.appendChild(testLbl); body.appendChild(testRow);

            /* Progress */
            var progWrap=el("div","display:none");
            var progBarWrap=el("div","height:8px;background:#e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:6px");
            var progBar=el("div","height:100%;background:#27ae60;width:0%;border-radius:8px;transition:width .3s");
            var progLbl=el("div","font-size:12px;color:#6b7280;margin-bottom:6px");
            var progLog=el("div","max-height:120px;overflow-y:auto;font-size:11px;font-family:monospace;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:6px");
            progBarWrap.appendChild(progBar);progWrap.appendChild(progBarWrap);progWrap.appendChild(progLbl);progWrap.appendChild(progLog);
            body.appendChild(progWrap);
            function logLine(txt,ok){var ln=document.createElement("div");ln.style.cssText="padding:1px 0;color:"+(ok===false?"#dc2626":ok===true?"#16a34a":"#374151");ln.textContent=txt;progLog.appendChild(ln);progLog.scrollTop=progLog.scrollHeight;}

            /* Buttons */
            var btnRow=el("div","display:flex;gap:8px");
            var btnCancel=el("button","flex:1;height:42px;border:1.5px solid #d1d5db;border-radius:8px;background:#fff;font-size:13px;font-weight:700;cursor:pointer;color:#374151"); btnCancel.textContent="Cancel";
            btnCancel.onclick=function(){document.body.removeChild(ov);};
            var btnRun=el("button","flex:2;height:42px;border:none;border-radius:8px;background:#1a1a2e;color:#fff;font-size:13px;font-weight:800;cursor:pointer"); btnRun.textContent="\u25B6  Run";
            body.appendChild(btnRow);btnRow.appendChild(btnCancel);btnRow.appendChild(btnRun);
            box.appendChild(body);ov.appendChild(box);document.body.appendChild(ov);
            buildSchedule(0,true);

            btnRun.onclick=async function(){
                var accts=getAccts();
                if(!accts.length){alert("No 6-digit account numbers found.");return;}
                var testMode=testCb.checked;
                var queue=[];var ai=0;
                for(var ri=0;ri<dayRows.length&&ai<accts.length;ri++){var row=dayRows[ri];if(!row.cb.checked)continue;var perDay=parseInt(row.countInp.value)||3;for(var j=0;j<perDay&&ai<accts.length;j++,ai++){queue.push({acct:accts[ai],date:row.date});}}
                if(!queue.length){alert("No active days in schedule.");return;}
                if(!confirm((testMode?"[TEST MODE] ":"")+"Submit "+queue.length+" meeting"+(queue.length!==1?"s":"")+"?")){return;}
                btnRun.disabled=true;btnRun.textContent="\u23F3 Running...";btnCancel.disabled=true;
                progWrap.style.display="block";
                var done=0,failed=0;
                for(var qi=0;qi<queue.length;qi++){
                    var item=queue[qi];
                    progBar.style.width=Math.round(qi/queue.length*100)+"%";
                    progLbl.textContent="Processing "+(qi+1)+" of "+queue.length+" \u2014 "+item.acct+(testMode?" [TEST]":"");
                    logLine((qi+1)+"/"+queue.length+" "+item.acct+" \u2192 "+_fmtMDY(item.date)+(testMode?" [TEST]":""));
                    try{
                        var ctx=_findCtx();
                        _setv(ctx,ctx.d.getElementById("ctl01_dtStartDate"),_fmtWP(item.date));
                        _setv(ctx,ctx.d.getElementById("ctl01_dtEndDate"),_fmtWP(item.date));
                        _setCompleted(ctx);
                        var allDayEl=ctx.d.getElementById("ctl01_cbAllDay");
                        if(allDayEl&&(allDayCb.checked!==allDayEl.checked)){allDayEl.click();allDayEl.dispatchEvent(new Event("change",{bubbles:true}));}
                        var syncEl=ctx.d.getElementById("ctl01_cbSync");
                        if(syncEl&&(syncCb.checked!==syncEl.checked)){syncEl.click();syncEl.dispatchEvent(new Event("change",{bubbles:true}));}
                        if(commentCb.checked){var comments=getComments();if(comments.length){var pick=comments[Math.floor(Math.random()*comments.length)];var notesEl=ctx.d.getElementById("ctl01_txtNotes");_setv(ctx,notesEl,pick);logLine("  \uD83D\uDCAC "+pick.slice(0,40)+(pick.length>40?"\u2026":""));}}
                        await _selectAccount(ctx,item.acct);
                        await _s(400);
                        await _clickOK(ctx,testMode);
                        if(!testMode){await _s(2600);await _clickAddAnother();await _s(1600);}else{await _s(600);}
                        done++;logLine("  \u2713 OK",true);
                    }catch(err){failed++;logLine("  \u2717 "+err.message,false);}
                }
                progBar.style.width="100%";
                progLbl.textContent=(testMode?"[TEST] ":"")+"Done \u2014 "+done+" added"+(failed?" | "+failed+" failed":"")+" \uD83C\uDF89";
                btnRun.textContent="\u2713 Done";btnCancel.disabled=false;btnCancel.textContent="Close";
            };
        }


        /* ============================================================
           QUICK LINKS  — navigate to key pages
        ============================================================ */
        var quickLinks = [];

        quickLinks = quickLinks.concat([
            {
                label: "🌐  Web Connect",
                fn: function () {
                    window.open("https://wc.smalink.net", "_blank");
                }
            },
            {
                label: "📅  Daily Activity",
                fn: function () {
                    location.href = "https://wc.smalink.net/common/dailyactivity/dailyactivity.aspx";
                }
            },
            {
                label: "📊  Month Sales",
                fn: function () {
                    location.href = "https://wc.smalink.net/common/invoices/invoicehistory.aspx";
                }
            },
            {
                label: "✏️  New Order Form",
                fn: function () {
                    location.href = "https://wc.smalink.net/common/remoteorders/remoteorderform.aspx";
                }
            },
            {
                label: "📂  Remote Orders List",
                fn: function () {
                    location.href = "https://wc.smalink.net/common/remoteorders/manageremoteorders.aspx";
                }
            },
            {
                label: "📈  Whitecup Reporting",
                fn: function () {
                    window.open("https://sma.whitecupgo.com/mitsbi/landingPageRedirect.flow", "_blank");
                }
            },
            {
                label: "📁  Sales Info Documents",
                fn: function () {
                    window.open("https://smalink.sharepoint.com/:f:/s/sma-salesinfo/EmwuFMrn4QBBk8aVmfEQINgBLQrdHKs-DSTp1kOkDwi5dA?e=d0E3c2&xsdata=MDV8MDJ8cGF1bC5hZ2VydG9uQHNtYWxpbmsuY29tfDI0NjMyMTY4ZDM3YjQyZDIyN2FhYzA4ZGUwMGY0NWZmMXxiMmY3NTZkYjBjNzQ0ODY1ODdjODU1OTliYjM2NmU0NXwxfDB8NjM4OTQ5MjQ2NzMzNzk5MDczfFVua25vd258VFdGcGJHWnNiM2Q4ZXlKRmJYQjBlVTFoY0draU9uUnlkV1VzSWxZaU9pSXdMakF1TURBd01DSXNJbEFpT2lKWGFXNHpNaUlzSWtGT0lqb2lUV0ZwYkNJc0lsZFVJam95ZlE9PXwwfHx8&sdata=T0o5TUFmcmdwbWRqS3ZKdzZHZldkQVk1QWYvbUxIcitkdFF1Q0lTZmlQdz0%3d", "_blank");
                }
            },
            {
                label: "🔀  Wildref Cross Reference",
                fn: function () {
                    window.open("https://wildref.us", "_blank");
                }
            },
            {
                label: "📰  SMA Newsletter Library",
                fn: function () {
                    window.open("https://us2.campaign-archive.com/home/?u=09ee027cade0749c3df3c59a0&id=eb112731a7", "_blank");
                }
            },
            {
                label: "📊  SMA Reportal",
                fn: function () {
                    var p = makePanel("SMA Reportal Login");
                    var pan = p.panel;

                    var body = el("div", S.scroll + ";padding:16px 14px");

                    var icon = el("div", "font-size:40px;text-align:center;margin-bottom:12px");
                    icon.textContent = "🔐";

                    var intro = el("div",
                        "font-size:13px;color:#555;margin-bottom:16px;text-align:center;line-height:1.5");
                    intro.textContent = "Reportal uses your normal SMA Microsoft credentials — with one difference:";

                    var card = el("div",
                        "background:#f0f4ff;border:1.5px solid #c5d0f0;border-radius:12px;" +
                        "padding:14px 16px;margin-bottom:10px");

                    var row1 = el("div", "margin-bottom:10px");
                    var l1 = el("div", "font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px");
                    l1.textContent = "Username";
                    var v1 = el("div", "font-size:14px;color:#1a1a2e;font-weight:600");
                    v1.innerHTML = "Your email <b>without</b> @smalink.com<br>" +
                        "<span style='font-size:12px;color:#555;'>e.g. <code style='background:#e8ecff;padding:1px 5px;border-radius:4px;'>jsmith</code> " +
                        "not <code style='background:#ffe8e8;padding:1px 5px;border-radius:4px;text-decoration:line-through;'>jsmith@smalink.com</code></span>";
                    row1.appendChild(l1); row1.appendChild(v1);

                    var divider = el("div", "border-top:1px solid #d0d8f0;margin:10px 0");

                    var row2 = el("div");
                    var l2 = el("div", "font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px");
                    l2.textContent = "Password";
                    var v2 = el("div", "font-size:14px;color:#1a1a2e;font-weight:600");
                    v2.textContent = "Your normal SMA password";
                    row2.appendChild(l2); row2.appendChild(v2);

                    card.appendChild(row1); card.appendChild(divider); card.appendChild(row2);
                    body.appendChild(icon); body.appendChild(intro); body.appendChild(card);
                    pan.appendChild(body);

                    var foot = el("div",
                        "padding:10px;border-top:1px solid #e0e0e0;background:#fafafa;" +
                        "flex-shrink:0;display:flex;gap:8px");
                    var bGo = el("button", S.btnPri); bGo.textContent = "Got it — Open Reportal";
                    var bCa = el("button", S.btnDanger); bCa.textContent = "Cancel";
                    [bGo, bCa].forEach(function (b) { foot.appendChild(b); });
                    pan.sealFooter(foot);

                    bGo.addEventListener("click", function () {
                        p.close();
                        window.open("https://reportal.smalink.net/reports.aspx", "_blank");
                    });
                    bCa.addEventListener("click", p.close);
                }
            },
            {
                label: "💼  WP-CRM",
                fn: function () {
                    window.open("https://crm.smalink.net/", "_blank");
                }
            },
            {
                label: "💵  401k Funds",
                fn: function () {
                    window.open("https://wildref.us/funds.html", "_blank");
                }
            },
            {
                label: "🏦  Benefits For You",
                fn: function () {
                    window.open("https://www.benefitsforyou.com/Landing", "_blank");
                }
            },
            {
                label: "💳  iSolved Payroll",
                fn: function () {
                    window.open("https://www.myisolved.com/UserLogin.aspx", "_blank");
                }
            }
        ]);

        /* ============================================================
           MAIN MENU  — grouped, mobile-first
        ============================================================ */

        /* remove any existing menu */
        var existing = document.getElementById("__smalink_menu__");
        if (existing) { existing.parentNode.removeChild(existing); return; }

        /*
         *  Menu layout: fixed overlay approach so Cancel is always visible.
         *  The outer wrapper is a full-screen flex column; the inner card
         *  sits in the middle and scrolls internally, leaving Cancel pinned
         *  at the bottom — clear of Safari's bottom bar.
         */
        var menuOv = el("div",
            "position:fixed;inset:0;z-index:999999;display:flex;flex-direction:column;" +
            "align-items:center;justify-content:flex-start;" +
            "padding:env(safe-area-inset-top,20px) 0 0 0;" +
            "background:rgba(0,0,0,.45)");
        menuOv.id = "__smalink_menu__";

        /* card — flex column, fills available height up to a max */
        var menu = el("div",
            "display:flex;flex-direction:column;" +
            "width:92%;max-width:400px;" +
            "max-height:calc(100vh - env(safe-area-inset-top,20px) - env(safe-area-inset-bottom,20px) - 16px);" +
            "background:#fff;border:2px solid #1a1a2e;border-radius:16px;" +
            "box-shadow:0 10px 40px rgba(0,0,0,.35);overflow:hidden");

        /* ============================================================
           HELP  — loaded on demand from smalink-help.js
           Only downloaded when the ? button is tapped.
        ============================================================ */
        function showHelp() {
            if (window.smalinkHelp) {
                /* already loaded this session — just show it */
                window.smalinkHelp(makePanel, el, S, CFG);
                return;
            }
            /* show a loading indicator while fetching */
            var lp = makePanel("📖  Loading Help...");
            var lbody = el("div",
                S.scroll + ";padding:40px;text-align:center;font-size:14px;color:#666");
            lbody.textContent = "Loading help content…";
            lp.panel.appendChild(lbody);

            var s = document.createElement("script");
            s.src = "https://wildref.us/tools/smalink-help.js?" + Date.now();
            s.onload = function () {
                lp.close();
                if (window.smalinkHelp) {
                    window.smalinkHelp(makePanel, el, S, CFG);
                } else {
                    alert("Help file loaded but smalinkHelp() not found.");
                }
            };
            s.onerror = function () {
                lp.close();
                alert("Could not load help file.\nCheck your connection and try again.");
            };
            document.body.appendChild(s);
        }

        /* ============================================================
           MAIN MENU HEADER  — LINK logo | title | ? help button
        ============================================================ */
        var mHdr = el("div",
            "background:#1a1a2e;color:#fff;padding:12px 14px;flex-shrink:0;" +
            "display:flex;align-items:center;justify-content:space-between;gap:6px");

        /* ── LINK icon button (left) — opens vendor panel directly ── */
        var mLink = el("button",
            "flex:0 0 auto;width:30px;height:30px;" +
            "border-radius:8px;border:2px solid rgba(255,255,255,.45);" +
            "background:transparent;color:#fff;" +
            "cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0");

        /* contacts / address book icon */
        var mLinkIcon = document.createElementNS("http://www.w3.org/2000/svg","svg");
        mLinkIcon.setAttribute("viewBox","0 0 24 24");
        mLinkIcon.setAttribute("fill","none");
        mLinkIcon.setAttribute("stroke","currentColor");
        mLinkIcon.setAttribute("stroke-width","2");
        mLinkIcon.setAttribute("stroke-linecap","round");
        mLinkIcon.setAttribute("stroke-linejoin","round");
        mLinkIcon.style.cssText = "width:16px;height:16px";
        var mli1 = document.createElementNS("http://www.w3.org/2000/svg","rect");
        mli1.setAttribute("x","4"); mli1.setAttribute("y","2");
        mli1.setAttribute("width","16"); mli1.setAttribute("height","20");
        mli1.setAttribute("rx","2");
        var mli2 = document.createElementNS("http://www.w3.org/2000/svg","line");
        mli2.setAttribute("x1","2"); mli2.setAttribute("y1","7");
        mli2.setAttribute("x2","4"); mli2.setAttribute("y2","7");
        var mli3 = document.createElementNS("http://www.w3.org/2000/svg","line");
        mli3.setAttribute("x1","2"); mli3.setAttribute("y1","12");
        mli3.setAttribute("x2","4"); mli3.setAttribute("y2","12");
        var mli4 = document.createElementNS("http://www.w3.org/2000/svg","circle");
        mli4.setAttribute("cx","12"); mli4.setAttribute("cy","9"); mli4.setAttribute("r","3");
        var mli5 = document.createElementNS("http://www.w3.org/2000/svg","path");
        mli5.setAttribute("d","M6 21 Q6 16 12 16 Q18 16 18 21");
        mLinkIcon.appendChild(mli1);
        mLinkIcon.appendChild(mli2);
        mLinkIcon.appendChild(mli3);
        mLinkIcon.appendChild(mli4);
        mLinkIcon.appendChild(mli5);
        mLink.appendChild(mLinkIcon);

        mLink.addEventListener("click", function (e) {
            e.stopPropagation();
            menuOv.parentNode.removeChild(menuOv);
            showVendorPanel();
        });
        mLink.addEventListener("touchstart", function () {
            mLink.style.background = "rgba(255,255,255,.15)";
        }, { passive: true });
        mLink.addEventListener("touchend", function () {
            mLink.style.background = "transparent";
        }, { passive: true });

        /* ── Title (centre) ── */
        var mTitle = el("span",
            "font-size:15px;font-weight:800;letter-spacing:.5px;flex:1;text-align:center");
        mTitle.textContent = "SMA Link Actions  v" + CFG.version;

        /* ── Help ? button (right) ── */
        var mHelp = el("button",
            "flex:0 0 auto;width:30px;height:30px;border-radius:50%;" +
            "border:2px solid rgba(255,255,255,.5);" +
            "background:transparent;color:#fff;font-size:15px;font-weight:800;" +
            "cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1");
        mHelp.textContent = "?";
        mHelp.addEventListener("click", function (e) {
            e.stopPropagation();
            menuOv.parentNode.removeChild(menuOv);
            showHelp();
        });

        mHdr.appendChild(mLink);
        mHdr.appendChild(mTitle);
        mHdr.appendChild(mHelp);
        menu.appendChild(mHdr);

        /* Vendor directory opens as standalone page */
        function showVendorPanel() {
            window.open("https://wildref.us/vendors.html", "_blank");
        }

        /* scrollable body — grows to fill, shrinks when needed */
        var mBody = el("div",
            "overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1;padding:10px 10px 4px");

        function addSection(label, actionList) {
            if (!actionList.length) return;

            if (label) {
                var sep = el("div", S.sep);
                sep.textContent = label;
                mBody.appendChild(sep);
            }

            actionList.forEach(function (act) {
                var b = el("button",
                    "display:block;width:100%;min-height:44px;margin:4px 0;" +
                    "padding:10px 12px;font-size:14px;font-weight:600;text-align:left;" +
                    "border:1.5px solid #dde;border-radius:10px;background:#f8f8fc;" +
                    "cursor:pointer;transition:background .12s;box-sizing:border-box");
                b.textContent = act.label;
                b.addEventListener("click", function () {
                    menuOv.parentNode.removeChild(menuOv);
                    act.fn();
                });
                b.addEventListener("touchstart", function () {
                    b.style.background = "#e8e8f8";
                }, { passive: true });
                b.addEventListener("touchend", function () {
                    b.style.background = "#f8f8fc";
                }, { passive: true });
                mBody.appendChild(b);
            });
        }

        if (pageActions.length) {
            addSection("This Page", pageActions);
        }
        addSection(pageActions.length ? "Search & Navigate" : null, globalActions);
        addSection("Quick Links", quickLinks);

        menu.appendChild(mBody);

        /* Cancel — pinned at bottom of card, never scrolls away */
        var mFoot = el("div",
            "flex-shrink:0;padding:8px 10px;border-top:1px solid #e0e0e0;background:#fafafa");
        var bCancel = el("button",
            "display:block;width:100%;min-height:44px;padding:10px 12px;" +
            "font-size:14px;font-weight:700;text-align:center;box-sizing:border-box;" +
            "border:none;border-radius:10px;background:#e74c3c;color:#fff;cursor:pointer");
        bCancel.textContent = "✕  Cancel";
        bCancel.addEventListener("click", function () {
            menuOv.parentNode.removeChild(menuOv);
        });
        mFoot.appendChild(bCancel);
        menu.appendChild(mFoot);

        menuOv.appendChild(menu);
        document.body.appendChild(menuOv);

        /* Tap outside card to close */
        menuOv.addEventListener("click", function (e) {
            if (e.target === menuOv) menuOv.parentNode.removeChild(menuOv);
        });

    } catch (e) {
        alert("SMA Actions error: " + e.message);
    }
};

/* Auto-run when loaded via bookmarklet */
window.smalinkActions();
