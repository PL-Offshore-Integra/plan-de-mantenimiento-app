import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "./lib/supabase";
import { TAXONOMIA_TECNICA } from "./lib/taxonomiaTecnica";

const NOMBRE_TRIPULACION = "Jefe de Máquinas";
const NOMBRE_GERENCIA = "Gerente Técnico";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/*  TOKENS · INTEGRA Brand Book v1.0 
   Los nombres de variable son los que ya usaba esta app: cambian los valores,
   no los selectores. Navy = estructura, nunca acción. Un solo color de acción.
    */
:root{
  --navy:#082F4E;--blue:#056D76;--mid:#4A5560;--light:#C9D0D6;
  --bg:#FAFBFC;--surface:#FFFFFF;--surface2:#F4F6F8;--surface3:#E4E8EC;
  --border:#E4E8EC;--border2:#C9D0D6;
  --text:#0F1419;--muted:#4A5560;--muted2:#7A8792;
  --accent:#056D76;--accent2:#0E7A5F;--warn:#8F5A0B;--danger:#B3261E;
  --purple:#4A5560;--teal:#056D76;--orange:#8F5A0B;
  --mono:'IBM Plex Mono',monospace;--sans:'IBM Plex Sans',sans-serif;--r:4px;--r2:4px;
  --nav:#082F4E;--action:#056D76;--action-press:#04565D;
  --tr:color 120ms cubic-bezier(.2,0,.38,.9),background-color 120ms cubic-bezier(.2,0,.38,.9),border-color 120ms cubic-bezier(.2,0,.38,.9);
}
/* Instancia: se activa con <html data-instance="pl-offshore"> en index.html */
[data-instance="pl-offshore"]{--nav:#002247;--action:#002247;--blue:#002247;--accent:#002247}
[data-instance="clean-sea"]{--nav:#1B3765;--action:#006945;--blue:#006945;--accent:#006945}
[data-instance="terramare"]{--nav:#213363;--action:#1F5285;--blue:#1F5285;--accent:#1F5285}

body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.55;min-height:100vh;overflow-x:hidden}
*:focus-visible{outline:2px solid var(--action);outline-offset:2px}
.app{display:flex;min-height:100vh;overflow-x:hidden}

/*  NAVEGACIÓN LATERAL · 240px, colapsa a iconos en mobile  */
.sidebar{width:240px;min-width:240px;background:var(--nav);display:flex;flex-direction:column}
.sidebar-header{border-bottom:1px solid rgba(255,255,255,.14)}
.sidebar-logo-wrap{padding:14px 16px;display:flex;align-items:center;gap:12px;height:56px}
.sidebar-logo-img{width:28px;height:28px;object-fit:contain;border-radius:var(--r);border:0;background:rgba(255,255,255,.14)}
.sidebar-logo-main{font-size:14px;font-weight:600;color:#fff;letter-spacing:0;text-transform:none}
.sidebar-logo-sub{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.72);margin-top:2px;letter-spacing:.06em;text-transform:uppercase}
.nav-section{padding:16px 16px 6px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:rgba(255,255,255,.72);text-transform:uppercase}
.ni{display:flex;align-items:center;gap:10px;padding:9px 16px;font-size:14px;font-weight:500;cursor:pointer;color:rgba(255,255,255,.72);border-left:3px solid transparent;transition:var(--tr);user-select:none;min-height:36px}
.ni:hover{color:#fff;background:rgba(255,255,255,.08)}
.ni.active{color:#fff;border-left-color:var(--action);background:rgba(255,255,255,.12);font-weight:500}
.ni.sub{padding-left:34px;font-size:13px;font-weight:400}
.ni.sub.active{font-weight:500}
.ni.back{color:rgba(255,255,255,.72);font-size:13px;border-top:1px solid rgba(255,255,255,.14);margin-top:6px}
.ni.back:hover{color:#fff}
.ni-icon{font-size:14px;width:16px;text-align:center;flex-shrink:0}
.ni-badge{margin-left:auto;background:rgba(255,255,255,.14);color:#fff;font-family:var(--mono);font-size:11px;font-weight:500;padding:2px 7px;border-radius:3px;min-width:20px;text-align:center}
.ni-badge.amber{background:rgba(255,255,255,.14)}
.ni-badge.gray{background:rgba(255,255,255,.14);color:rgba(255,255,255,.72)}

/*  BARRA SUPERIOR · 56px  */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between}
.topbar-title{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.content{flex:1;overflow-y:auto;overflow-x:hidden;padding:24px;background:var(--bg)}

/*  PANELES · blancos, borde 1px, radio 4, sin sombra  */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:24px;margin-bottom:16px}
.card-title{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px}

/*  KPIs  */
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:24px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px}
.stat-label{font-family:var(--mono);font-size:11px;color:var(--muted);font-weight:500;letter-spacing:.08em;margin-bottom:8px;text-transform:uppercase}
.stat-value{font-family:var(--mono);font-size:30px;font-weight:600;color:var(--navy);font-variant-numeric:tabular-nums}
.va{color:var(--navy)}.vg{color:var(--accent2)}.vr{color:var(--danger)}.vp{color:var(--muted)}.vm{color:var(--warn)}.vgr{color:var(--muted)}

/*  TABLAS · fila 40px, regla marcada de 2px navy, dato en mono  */
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:2px solid var(--navy);white-space:nowrap;background:var(--surface)}
td{padding:12px;border-bottom:1px solid var(--border);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr.click:hover td{background:var(--surface2);cursor:pointer}
.tracker-table th{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;padding:10px 12px;text-align:left;border-bottom:2px solid var(--navy);white-space:nowrap;background:var(--surface);position:sticky;top:0;z-index:2}
.tracker-table th.sortable{cursor:pointer;user-select:none}
.tracker-table th.sortable:hover{color:var(--navy)}
.tracker-table td{padding:12px;border-bottom:1px solid var(--border);vertical-align:middle}
.tracker-table tr:hover td{background:var(--surface2);cursor:pointer}
.tracker-table tr:last-child td{border-bottom:none}

/*  ARBOL · plan de mantenimiento por código jerárquico  */
.arbol-nodo{border-bottom:1px solid var(--border)}
.arbol-nodo:last-child{border-bottom:none}
.arbol-fila{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;cursor:pointer;padding:11px 12px;text-align:left;font-family:var(--sans)}
.arbol-fila:hover{background:var(--surface2)}
.arbol-caret{color:var(--muted2);font-size:11px;width:10px;flex:0 0 auto}
.arbol-codigo{font-family:var(--mono);font-size:11px;color:var(--muted);flex:0 0 auto}
.arbol-label{font-size:13px;font-weight:500;color:var(--navy);flex:1 1 auto}
.arbol-count{font-family:var(--mono);font-size:11px;color:var(--muted2);flex:0 0 auto}

/*  FILTROS  */
.filter-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.filter-input,.filter-select{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--sans);font-size:14px;height:36px;padding:0 10px;outline:none;min-width:150px;transition:var(--tr)}
.filter-select{cursor:pointer}
.filter-input:focus,.filter-select:focus{border-width:2px;border-color:var(--action);padding:0 9px}

/*  BADGES DE ESTADO · fondo tenue, texto de estado, mono caja alta  */
.badge{display:inline-flex;align-items:center;font-family:var(--mono);font-size:11px;font-weight:500;padding:3px 8px;border-radius:3px;white-space:nowrap;letter-spacing:.06em;text-transform:uppercase}
.b-amber{background:#FBF1E3;color:#8F5A0B;border:0}
.b-blue{background:#E6F1F2;color:#056D76;border:0}
.b-teal{background:#E8F3EF;color:#0E7A5F;border:0}
.b-red{background:#FAEAE8;color:#B3261E;border:0}
.b-purple{background:#F4F6F8;color:#4A5560;border:0}
.b-orange{background:#FBF1E3;color:#8F5A0B;border:0}
.b-green{background:#E8F3EF;color:#0E7A5F;border:0}
.b-gray{background:#F4F6F8;color:#4A5560;border:0}
.urgdot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:6px;flex-shrink:0}

/*  BOTONES · un solo primario por vista. Nada se mueve al presionar  */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--sans);font-size:14px;font-weight:500;letter-spacing:0;height:36px;padding:0 16px;border-radius:var(--r);border:1px solid transparent;cursor:pointer;transition:var(--tr);white-space:nowrap;text-transform:none}
.btn-primary{background:var(--action);color:#fff}
.btn-primary:hover{background:var(--navy)}
.btn-primary:active{background:var(--action-press)}
.btn-success{background:var(--accent2);color:#fff}
.btn-success:hover{background:#0B6249}
.btn-danger{background:var(--surface);color:var(--danger);border-color:var(--border2)}
.btn-danger:hover{background:#FAEAE8;border-color:var(--danger)}
.btn-ghost{background:var(--surface);color:var(--muted);border-color:var(--border2)}
.btn-ghost:hover{color:var(--text);background:var(--surface2)}
.btn-warn{background:var(--surface);color:var(--warn);border-color:var(--border2)}
.btn-warn:hover{background:#FBF1E3;border-color:var(--warn)}
.btn-cond{background:var(--surface);color:var(--muted);border-color:var(--border2)}
.btn-cond:hover{background:var(--surface2)}
.btn-confirm{background:var(--surface);color:var(--warn);border-color:var(--border2)}
.btn-confirm:hover{background:#FBF1E3}
.btn-sm{height:28px;padding:0 12px;font-size:13px}
.btn:disabled{background:var(--surface3);color:var(--muted2);border-color:transparent;cursor:not-allowed}

/*  CAPAS FLOTANTES · la única sombra del sistema  */
.overlay{position:fixed;inset:0;background:rgba(15,20,25,.45);display:flex;align-items:flex-start;justify-content:center;z-index:100;padding:24px;overflow-y:auto}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);width:100%;max-width:860px;margin:auto;box-shadow:0 8px 24px rgba(15,20,25,.14)}
.modal-lg{max-width:1120px}
.mhdr{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:20px 24px;border-bottom:1px solid var(--border);background:var(--surface);border-radius:var(--r) var(--r) 0 0}
.mtitle{font-size:18px;font-weight:600;letter-spacing:0;color:var(--navy)}
.mbody{padding:24px}
.mftr{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;background:var(--surface2);border-radius:0 0 var(--r) var(--r)}
.mclose{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;transition:var(--tr)}
.mclose:hover{color:var(--navy)}
@keyframes fadeIn{from{opacity:1}to{opacity:1}}
@keyframes slideUp{from{opacity:1}to{opacity:1}}

/*  FORMULARIOS · campo 36px, foco borde 2px  */
.fg{display:flex;flex-direction:column;gap:6px}
.fg label{font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;font-weight:500}
.fg input,.fg select,.fg textarea{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--sans);font-size:14px;height:36px;padding:0 12px;outline:none;transition:var(--tr)}
.fg textarea{resize:vertical;min-height:72px;height:auto;padding:10px 12px}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-width:2px;border-color:var(--action);padding:0 11px}
.fg textarea:focus{padding:9px 11px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px}
.form-section{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.items-edit th{font-family:var(--mono);font-size:11px;background:var(--surface)}
.items-edit td{padding:6px 8px}
.items-edit input,.items-edit select{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-family:var(--mono);font-size:13px;height:32px;padding:0 8px;width:100%;outline:none;transition:var(--tr)}
.items-edit input:focus,.items-edit select:focus{border-width:2px;border-color:var(--action);padding:0 7px}

/*  TRAZABILIDAD  */
.tl{list-style:none}
.tl-item{display:flex;gap:12px;padding-bottom:16px;position:relative}
.tl-item:not(:last-child)::before{content:'';position:absolute;left:11px;top:24px;bottom:0;width:1px;background:var(--border)}
.tl-dot{width:24px;height:24px;border-radius:50%;background:var(--surface2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;z-index:1}
.tl-dot.c{border-color:var(--action);color:var(--action);background:#E6F1F2}
.tl-dot.a{border-color:var(--accent2);color:var(--accent2);background:#E8F3EF}
.tl-dot.r{border-color:var(--danger);color:var(--danger);background:#FAEAE8}
.tl-dot.u{border-color:var(--warn);color:var(--warn);background:#FBF1E3}
.tl-ev{font-size:14px;font-weight:500;color:var(--navy)}
.tl-meta{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:4px}

/*  FILA DE REQUISICIÓN · el estado va en el borde izquierdo de 3px  */
.req-row{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;margin-bottom:12px;cursor:pointer;transition:var(--tr)}
.req-row:hover{border-color:var(--navy)}
.req-row.unread{border-left:3px solid var(--action)}
.req-row.devuelto{border-left:3px solid var(--warn)}
.req-row.pend-confirm{border-left:3px solid var(--warn)}
.req-title{font-weight:600;font-size:15px;margin-bottom:6px;color:var(--navy)}
.req-meta{display:flex;gap:16px;font-size:13px;color:var(--muted);flex-wrap:wrap;align-items:center}

/*  AVISOS  */
.notif{position:fixed;bottom:24px;right:24px;background:var(--surface);border:1px solid var(--border);border-left-width:3px;border-radius:var(--r);padding:14px 16px;font-size:14px;z-index:300;max-width:360px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(15,20,25,.14)}
.n-green{border-left-color:var(--accent2)}.n-red{border-left-color:var(--danger)}.n-amber{border-left-color:var(--warn)}.n-blue{border-left-color:var(--action)}
.info-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;font-size:14px}
.info-box.accent{border-left:3px solid var(--action)}
.info-box.warn{border-left:3px solid var(--warn)}
.info-box.danger{border-left:3px solid var(--danger)}
.info-box.orange{border-left:3px solid var(--warn)}

/*  UTILIDADES  */
.flex-gap{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.flex-between{display:flex;justify-content:space-between;align-items:center;gap:12px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.text-mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.text-muted{color:var(--muted)}
.empty-state{text-align:center;padding:48px 24px;color:var(--muted);font-size:15px}
.loading{display:flex;align-items:center;justify-content:center;padding:48px;color:var(--muted);gap:12px;font-size:15px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.kbar{margin-bottom:12px}
.kbar-lbl{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px}
.kbar-track{height:6px;background:var(--surface3);border-radius:3px;overflow:hidden;border:0}
.kbar-fill{height:100%;border-radius:3px}
.tabs-row{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:24px;overflow-x:auto}
.tab{font-size:14px;font-weight:500;padding:10px 16px;cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;transition:var(--tr);text-transform:none;letter-spacing:0;margin-bottom:-1px;white-space:nowrap}
.tab:hover{color:var(--navy)}
.tab.active{color:var(--action);border-bottom-color:var(--action)}
.grupo-chip{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:3px;font-family:var(--mono);font-size:12px;font-weight:500;background:var(--surface2);color:var(--navy);border:1px solid var(--border);flex-shrink:0}
.tag{display:inline-block;font-family:var(--mono);font-size:11px;padding:3px 7px;background:var(--surface2);border:1px solid var(--border);border-radius:3px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.fecha-chip{display:inline-flex;flex-direction:column;gap:2px;font-family:var(--mono);font-size:11px;color:var(--text);white-space:nowrap;font-variant-numeric:tabular-nums}
.fecha-chip span:first-child{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.tracker-simple-row{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px}
.tracker-simple-row.en-curso{border-left:3px solid var(--warn)}
.tracker-simple-row.entregado{border-left:3px solid var(--accent2)}
.req-row-actions{display:flex;flex-direction:row;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);justify-content:flex-end}
.cotiz-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:16px}

/*  MOBILE  */
@media (max-width: 768px) {
  .app { flex-direction: column; }
  .sidebar { display: none; }
  .main { width: 100%; padding-bottom: 72px; }
  .topbar { padding: 0 16px; }
  .content { padding: 16px; }
  .card { padding: 16px; margin-bottom: 12px; }
  .stats { grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat { padding: 14px; }
  .stat-value { font-size: 24px; }
  .form-grid, .form-grid-3 { grid-template-columns: 1fr; gap: 12px; }
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { font-size: 13px; min-width: 540px; }
  th, td { padding: 10px 8px; }
  .tracker-table th, .tracker-table td { padding: 10px 8px; }
  .filter-row { flex-direction: column; align-items: stretch; }
  .filter-input, .filter-select { min-width: unset; width: 100%; }
  .btn { height: 44px; padding: 0 14px; }
  .btn-sm { height: 36px; }
  .mftr { flex-wrap: wrap; gap: 8px; }
  .mftr .btn { flex: 1; justify-content: center; }
  .overlay { padding: 0; align-items: flex-end; }
  .modal { border-radius: var(--r) var(--r) 0 0; max-width: 100%; max-height: 92vh; overflow-y: auto; }
  .modal-lg { max-width: 100%; }
  .req-meta { gap: 10px; }
  .req-title { font-size: 15px; }
  .tabs-row { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tab { font-size: 13px; padding: 10px 12px; }
  .notif { bottom: 88px; right: 12px; left: 12px; max-width: unset; }
  .items-edit { font-size: 13px; }
  .items-edit th, .items-edit td { padding: 6px; }
  .items-edit table { min-width: 380px; }
  .req-row-actions{flex-direction:column;gap:8px;width:100%}
  .req-row-actions .btn{width:100%}
  .mftr{flex-direction:column;align-items:stretch;gap:8px}
  .mftr .btn{width:100%;flex:unset}
  .mftr .btn-success{order:-3}.mftr .btn-primary{order:-2}.mftr .btn-danger{order:-1}
  .card-title{flex-direction:column;align-items:flex-start;gap:10px}
  .card-title .btn{width:100%}
  .filter-row .btn{width:100%}
  .form-footer-actions{flex-direction:column !important;align-items:stretch !important}
  .form-footer-actions .btn{width:100%}
  .cotiz-grid{grid-template-columns:1fr !important}
  .req-row .flex-between{flex-direction:column;align-items:flex-start;gap:10px}
  .req-row .flex-between > .flex-gap:last-child{width:100%;flex-direction:column;gap:8px}
  .req-row .flex-between > .flex-gap:last-child .btn{width:100%}
}

/*  NAVEGACIÓN INFERIOR (solo mobile)  */
@media (max-width: 768px) {
  .mobile-nav {
    display: flex !important;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--nav); border-top: 1px solid rgba(255,255,255,.14);
    z-index: 50; height: 64px;
    justify-content: space-around; align-items: center;
    padding: 0 4px; overflow-x: auto;
  }
  .mobile-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    cursor: pointer; padding: 8px; border-radius: var(--r);
    color: rgba(255,255,255,.72); transition: var(--tr); flex: 1;
    position: relative; min-width: 48px; min-height: 48px; justify-content: center;
  }
  .mobile-nav-item.active { color: #fff; background: rgba(255,255,255,.12); }
  .mobile-nav-item:hover { color: #fff; }
  .mobile-nav-icon { font-size: 16px; line-height: 1; }
  .mobile-nav-label { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; text-align: center; }
  .mobile-nav-badge {
    position: absolute; top: 4px; right: 8px;
    background: rgba(255,255,255,.14); color: #fff;
    font-family: var(--mono); font-size: 10px; font-weight: 500;
    padding: 1px 5px; border-radius: 3px; min-width: 16px; text-align: center;
  }
  .mobile-nav-badge.amber { background: rgba(255,255,255,.14); }
  .mobile-nav-badge.gray { background: rgba(255,255,255,.14); }
}
@media (min-width: 769px) {
  .mobile-nav { display: none !important; }
}

/*  ARMAZÓN · shell del prototipo 
   La navegación del módulo es BLANCA con borde derecho; el navy es la barra
   superior. El ítem activo lleva borde izquierdo de 3px en el color de acción.
    */
.shell{display:grid;grid-template-columns:248px minmax(0,1fr);align-items:stretch;min-height:100vh}
.shell.is-collapsed{grid-template-columns:68px minmax(0,1fr)}

.appbar{height:56px;background:var(--nav);display:flex;align-items:center;gap:24px;padding:0 24px;flex:0 0 auto}
.appbar-iso{height:26px;width:auto;object-fit:contain;display:block;flex:0 0 auto}
.appbar-div{width:1px;height:24px;background:rgba(255,255,255,.14);flex:0 0 auto}
.appbar-instance{font:500 14px/1.2 var(--sans);color:#fff;white-space:nowrap;flex:0 0 auto}
.appbar-search{flex:1;max-width:380px;display:flex;align-items:center;gap:10px;height:32px;padding:0 12px;background:rgba(255,255,255,.10);border:0;border-radius:var(--r);font:400 14px/1.2 var(--sans);color:rgba(255,255,255,.72)}
.appbar-search::placeholder{color:rgba(255,255,255,.72)}
.appbar-tools{margin-left:auto;display:flex;align-items:center;gap:16px}
.appbar-avatar{width:28px;height:28px;border-radius:var(--r);background:rgba(255,255,255,.14);color:#fff;font-family:var(--mono);font-size:12px;font-weight:500;line-height:28px;text-align:center;flex:0 0 auto}
.appbar-user{font:500 13px/1.25 var(--sans);color:#fff;white-space:nowrap}
.appbar-link{background:none;border:0;padding:0;cursor:pointer;font:500 13px/1.2 var(--sans);color:rgba(255,255,255,.86);white-space:nowrap}
.appbar-link:hover{color:#fff;text-decoration:underline}

.sidebar{width:auto;min-width:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column}
.sidebar-header{border-bottom:1px solid var(--border);padding:16px;display:flex;align-items:center;gap:12px;min-height:69px}
.sidebar-logo-img{width:32px;height:32px;object-fit:contain;border:0;border-radius:0;background:none;flex:0 0 auto}
.sidebar-logo-main{font:600 15px/1.3 var(--sans);color:var(--navy);letter-spacing:0;text-transform:none}
.sidebar-logo-sub{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-top:2px}
.sidebar-nav{flex:1;padding:12px 0;overflow-y:auto}
.nav-section{padding:14px 16px 8px;font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;text-align:left}
.ni{display:flex;align-items:center;gap:12px;width:100%;padding:9px 16px 9px 13px;background:transparent;border:0;border-left:3px solid transparent;cursor:pointer;text-align:left;font:400 14px/1.3 var(--sans);color:var(--muted);transition:var(--tr);min-height:38px}
.ni:hover{background:var(--surface2);color:var(--navy)}
.ni.active{background:var(--surface2);border-left-color:var(--action);color:var(--navy);font-weight:500}
.ni-ico{display:block;flex:0 0 auto;color:var(--muted2)}
.ni.active .ni-ico{color:var(--action)}
.ni-label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ni-badge{margin-left:auto;font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);background:var(--surface2);padding:3px 6px;border-radius:3px;min-width:22px;text-align:center;border:1px solid var(--border)}
.ni.active .ni-badge{color:var(--action);background:var(--surface);border-color:var(--border2)}
.ni-badge.amber{color:var(--warn)}
.ni-badge.gray{color:var(--muted)}
.sidebar-foot{border-top:1px solid var(--border);padding:12px 8px;display:flex;flex-direction:column;gap:2px}
.sidebar-foot-btn{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;background:none;border:0;border-radius:var(--r);cursor:pointer;font:500 13px/1.2 var(--sans);color:var(--muted);transition:var(--tr)}
.sidebar-foot-btn:hover{background:var(--surface2);color:var(--navy)}
.sidebar-foot-meta{padding:8px 10px 0;font-family:var(--mono);font-size:11px;font-weight:500;line-height:1.6;letter-spacing:.06em;color:var(--muted2)}
.user-menu-wrap{position:relative}
.user-menu-popup{position:absolute;left:0;right:0;bottom:calc(100% + 6px);background:var(--navy);border-radius:var(--r);padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:20}
.user-menu-item{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;background:none;border:0;border-radius:calc(var(--r) - 2px);cursor:pointer;font:500 13px/1.2 var(--sans);color:rgba(255,255,255,.86);transition:var(--tr)}
.user-menu-item:hover{background:rgba(255,255,255,.1)}
.user-menu-meta{border-top:1px solid rgba(255,255,255,.14);margin-top:4px;padding:8px 10px 4px;font-family:var(--mono);font-size:11px;font-weight:500;line-height:1.6;letter-spacing:.04em;color:rgba(255,255,255,.5)}
.shell.is-collapsed .sidebar-header{justify-content:center;padding:16px 8px}
.shell.is-collapsed .ni{justify-content:center;padding:9px 8px 9px 5px}
.shell.is-collapsed .sidebar-foot-btn{justify-content:center}

/*  encabezado de pantalla  */
.pagehead{background:var(--surface);border-bottom:1px solid var(--border);padding:16px 24px;flex:0 0 auto}
.crumb{display:flex;align-items:center;gap:8px;font:400 13px/1.2 var(--sans);color:var(--muted)}
.crumb button{background:none;border:0;padding:0;cursor:pointer;font:400 13px/1.2 var(--sans);color:var(--action)}
.crumb button:hover{text-decoration:underline;color:var(--navy)}
.crumb-current{color:var(--text)}
.pagehead-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-top:10px}
.pagehead h1{font:600 24px/1.25 var(--sans);color:var(--navy);margin:0}
.pagehead p{font:400 13px/1.45 var(--sans);color:var(--muted);margin:6px 0 0;max-width:70ch}
.pagehead-actions{display:flex;gap:8px;flex:0 0 auto}

@media (max-width:768px){
  .shell,.shell.is-collapsed{grid-template-columns:1fr}
  .sidebar{display:none}
  .appbar{gap:12px;padding:0 16px}
  .appbar-search,.appbar-instance{display:none}
  .pagehead{padding:14px 16px}
  .pagehead-row{flex-direction:column;align-items:stretch;gap:12px}
  .pagehead-actions .btn{flex:1}
  .main{padding-bottom:72px}
}

`;

const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("es-AR") : "—";
const today = () => new Date().toISOString().split("T")[0];
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; };

// Convierte frecuencias por tiempo en texto libre (ej: "6 meses", "anual") a
// días aproximados, para poder proyectar el vencimiento de tareas por fecha.
function parseFrecuenciaDias(texto) {
  if (!texto) return null;
  const t = texto.toLowerCase();
  if (/semanal/.test(t)) return 7;
  if (/mensual/.test(t)) return 30;
  if (/semestral/.test(t)) return 182;
  if (/anual/.test(t)) return 365;
  const m = t.match(/(\d+)\s*(años?|mes(?:es)?|semanas?|d[ií]as?)/);
  if (!m) return null;
  const n = parseInt(m[1]);
  const unidad = m[2];
  if (unidad.startsWith("año")) return n * 365;
  if (unidad.startsWith("mes")) return n * 30;
  if (unidad.startsWith("semana")) return n * 7;
  if (unidad.startsWith("d")) return n;
  return null;
}

// Equipos habilitados para carga diaria de horas de funcionamiento.
// Nombres tal como figuran en el PMS (NUEVO_PLAN_DE_MANTENIMIENTO_REV3.xlsx, hoja "Hoja1").
// El orden de esta lista es el orden en que se muestran en la pantalla "Carga de horas".
const EQUIPOS_HORAS = [
  "MMPP N°1 MAK 8M 453 AK",
  "MMPP N°2 MAK 8M 453 AK",
  "MMGG N°1 SCANIA DI 1259",
  "MMGG N°2 SCANIA DI 1259",
  "MMGG N°3 EGA DETROIT DIESEL V71",
  "MMDD BOW TRUSTER DETROIT DIESEL V71",
  "RADAR BABOR",
  "RADAR ESTRIBOR",
  "COMPRESOR BB",
  "COMPRESOR EB",
];

// Normaliza nombres para comparar sin depender de mayúsculas, acentos, el símbolo de
// grado/ordinal ("°" vs "º"), guiones o espacios. Deja solo letras y números.
const normalizaNombre = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // quita espacios, °, º, N°/Nº, guiones, puntos, etc.

// Busca un equipo por nombre tolerando variantes: primero coincidencia exacta
// (normalizada), y si no hay, coincidencia parcial (uno contiene al otro).
// Esto cubre casos como "RADAR N°1" en la lista vs "RADAR Nº1 FURUNO" en la base.
function buscaEquipoPorNombre(equipos, nombreBuscado) {
  const objetivo = normalizaNombre(nombreBuscado);
  const exacto = equipos.find(eq => normalizaNombre(eq.nombre) === objetivo);
  if (exacto) return exacto;
  return equipos.find(eq => {
    const actual = normalizaNombre(eq.nombre);
    return actual.includes(objetivo) || objetivo.includes(actual);
  }) || null;
}

const api = {
  async getBuques() {
    const { data, error } = await supabase.from("mant_buques").select("*").eq("activo", true).order("nombre");
    if (error) throw error; return data || [];
  },
  async getEquipos(buqueId) {
    const { data, error } = await supabase.from("mant_equipos").select("*").eq("buque_id", buqueId).eq("activo", true).order("sector").order("nombre");
    if (error) throw error; return data || [];
  },
  async getTareas(buqueId) {
    const { data, error } = await supabase
      .from("mant_tareas")
      .select("*, mant_equipos!inner(id, nombre, codigo, sistema, sector, marca, modelo, nro_serie, buque_id)")
      .eq("mant_equipos.buque_id", buqueId)
      .order("codigo");
    if (error) throw error; return data || [];
  },
  async getRegistrosHoras(buqueId) {
    const { data, error } = await supabase
      .from("mant_registros_horas")
      .select("*, mant_equipos(nombre)")
      .eq("buque_id", buqueId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error; return data || [];
  },
  async getUltimasHoras(buqueId) {
    const data = await api.getRegistrosHoras(buqueId);
    const map = {};
    data.forEach(h => { if (!map[h.equipo_id]) map[h.equipo_id] = h.horas; });
    return map;
  },
  async getPromedioHorasDiarias(buqueId, equipoId) {
    const { data, error } = await supabase
      .from("mant_registros_horas")
      .select("horas, fecha")
      .eq("buque_id", buqueId)
      .eq("equipo_id", equipoId)
      .order("fecha", { ascending: false })
      .limit(30);
    if (error || !data || data.length < 2) return null;
    const sorted = [...data].sort((a, b) => a.fecha > b.fecha ? 1 : -1);
    const first = sorted[0]; const last = sorted[sorted.length - 1];
    const dias = Math.max(1, (new Date(last.fecha) - new Date(first.fecha)) / 86400000);
    const hsGanadas = last.horas - first.horas;
    return hsGanadas > 0 ? Math.round(hsGanadas / dias * 10) / 10 : null;
  },
  async registrarHoras(registros) {
    const { error } = await supabase.from("mant_registros_horas").insert(registros);
    if (error) throw error;
  },
  async getEjecuciones(buqueId) {
    const { data, error } = await supabase
      .from("mant_ejecuciones")
      .select("*, mant_tareas(descripcion, frecuencia_hs, mant_equipos(nombre))")
      .eq("buque_id", buqueId)
      .order("fecha", { ascending: false });
    if (error) throw error; return data || [];
  },
  async registrarEjecucion(ej) {
    const { error } = await supabase.from("mant_ejecuciones").insert([ej]);
    if (error) throw error;
  },
  async getEjecucionesPorTarea(tareaId) {
    const { data, error } = await supabase
      .from("mant_ejecuciones")
      .select("fecha, horas_equipo")
      .eq("tarea_id", tareaId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getEjecucionesPorTareas(tareaIds) {
    if (!tareaIds.length) return [];
    const { data, error } = await supabase
      .from("mant_ejecuciones")
      .select("tarea_id, fecha, horas_equipo")
      .in("tarea_id", tareaIds)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getHorasEnFecha(buqueId, equipoId, fecha) {
    // Puede haber más de un registro cargado el mismo día (correcciones); se toma
    // el más reciente, igual que getUltimasHoras.
    const { data, error } = await supabase
      .from("mant_registros_horas")
      .select("horas")
      .eq("buque_id", buqueId)
      .eq("equipo_id", equipoId)
      .eq("fecha", fecha)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data && data.length ? data[0].horas : null;
  },
  async getUltimoRegistro(buqueId, equipoId, antesDe) {
    // antesDe: si se pasa, toma el último registro estrictamente anterior a esa
    // fecha, para que sirva de base estable aunque el propio día se corrija.
    let q = supabase.from("mant_registros_horas").select("horas, fecha").eq("buque_id", buqueId).eq("equipo_id", equipoId);
    if (antesDe) q = q.lt("fecha", antesDe);
    const { data, error } = await q
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data && data.length ? data[0] : null;
  },
  async getCorrectivos(buqueId) {
    const { data, error } = await supabase
      .from("mant_correctivos")
      .select("*, mant_equipos(nombre, codigo)")
      .eq("buque_id", buqueId)
      .order("created_at", { ascending: false });
    if (error) throw error; return data || [];
  },
  async crearCorrectivo(c) { const { error } = await supabase.from("mant_correctivos").insert([c]); if (error) throw error; },
  async actualizarCorrectivo(id, c) { const { error } = await supabase.from("mant_correctivos").update(c).eq("id", id); if (error) throw error; },
  async crearEquipo(eq) { const { data, error } = await supabase.from("mant_equipos").insert([eq]).select().single(); if (error) throw error; return data; },
  async crearTarea(t) { const { data, error } = await supabase.from("mant_tareas").insert([t]).select().single(); if (error) throw error; return data; },
  async actualizarTarea(id, c) { const { error } = await supabase.from("mant_tareas").update(c).eq("id", id); if (error) throw error; },
  async subirAdjunto(file, ejecucionId, carpeta = "riesgo") {
    const path = `${carpeta}/${ejecucionId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("mantenimiento").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("mantenimiento").getPublicUrl(path);
    return data.publicUrl;
  },
};

function calcEstado(tarea, horasActuales) {
  if (!tarea.frecuencia_hs || !horasActuales) return { estado: "sin_datos", restante: null, pct: 0 };
  const ultima = tarea.ultima_ejecucion_hs || 0;
  const proxima = ultima + tarea.frecuencia_hs;
  const restante = proxima - horasActuales;
  const pct = Math.min(((horasActuales - ultima) / tarea.frecuencia_hs) * 100, 100);
  if (restante < 0) return { estado: "vencida", restante, pct: 100 };
  if (restante <= tarea.frecuencia_hs * 0.1) return { estado: "proxima", restante, pct };
  return { estado: "ok", restante, pct };
}

function calcForecastFecha(restanteHs, promedioHsDiarias) {
  if (!restanteHs || restanteHs <= 0 || !promedioHsDiarias || promedioHsDiarias <= 0) return null;
  const diasRestantes = Math.ceil(restanteHs / promedioHsDiarias);
  return addDays(today(), diasRestantes);
}

function Notif({ msg, onClose }) {
  if (!msg) return null;
  const cls = { success: "n-green", error: "n-red", warn: "n-amber", info: "n-blue" }[msg.type] || "n-blue";
  return <div className={`notif ${cls}`}><span>{msg.text}</span><button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button></div>;
}

function FG({ label, hint, children, full }) {
  return <div className="fg" style={full ? { gridColumn: "1/-1" } : {}}>
    {label && <label>{label}</label>}
    {children}
    {hint && <div style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{hint}</div>}
  </div>;
}

//  MODAL: EJECUCIÓN CON ADJUNTO 
function EjecucionModal({ tarea, buqueId, horasActuales, horasVencimiento, onClose, onSave }) {
  const [form, setForm] = useState({
    tarea_id: tarea.id, buque_id: buqueId,
    fecha: today(), horas_equipo: horasActuales || "",
    realizado_por: "", observaciones: "",
    fue_fuera_termino: horasActuales > horasVencimiento,
    dias_fuera_termino: 0, adjunto_riesgo_url: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.realizado_por) return alert("Completá quién realizó el trabajo");
    setSaving(true);
    try {
      let adjunto_url = form.adjunto_riesgo_url;
      if (archivo) {
        const tempId = `temp_${Date.now()}`;
        adjunto_url = await api.subirAdjunto(archivo, tempId);
      }
      await api.registrarEjecucion({ ...form, adjunto_riesgo_url: adjunto_url });
      await api.actualizarTarea(tarea.id, {
        ultima_ejecucion_hs: parseInt(form.horas_equipo) || horasActuales,
        ultima_ejecucion_fecha: form.fecha,
      });
      onSave();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const fueraTerm = parseInt(form.horas_equipo) > horasVencimiento;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">Registrar ejecución</div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">
          <div className="info-box mb12" style={{ fontSize: 12 }}>
            <strong>{tarea.descripcion}</strong><br />
            <span style={{ color: "var(--muted)", fontSize: 11 }}>{tarea.mant_equipos?.nombre} · Frec: {tarea.frecuencia_hs ? `${tarea.frecuencia_hs} hs` : tarea.frecuencia_texto}</span>
          </div>
          {fueraTerm && (
            <div className="info-box danger mb12" style={{ fontSize: 11 }}>
               Ejecución fuera de término. Se registrará el atraso. Si corresponde, adjuntá la matriz de riesgo.
            </div>
          )}
          <div className="form-grid">
            <FG label="Fecha *"><input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} /></FG>
            <FG label="Horas del equipo al momento"><input type="number" value={form.horas_equipo} onChange={e => set("horas_equipo", e.target.value)} /></FG>
            <FG label="Realizado por *" full><input value={form.realizado_por} onChange={e => set("realizado_por", e.target.value)} placeholder="Nombre del responsable" /></FG>
          </div>
          <FG label="Observaciones" full><textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Notas del trabajo..." /></FG>
          {fueraTerm && <>
            <div className="form-section">Fuera de término</div>
            <div className="form-grid">
              <FG label="Días de atraso"><input type="number" min={0} value={form.dias_fuera_termino} onChange={e => set("dias_fuera_termino", parseInt(e.target.value) || 0)} /></FG>
              <FG label="Adjuntar matriz de riesgo (PDF)">
                <input type="file" accept=".pdf,.jpg,.png" onChange={e => setArchivo(e.target.files[0])} style={{ fontSize: 12, padding: "6px 0" }} />
              </FG>
            </div>
          </>}
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Registrar"}</button>
        </div>
      </div>
    </div>
  );
}

//  MODAL: CUMPLIR TAREA (desde el árbol del Plan completo)
function CumplirTareaModal({ tarea, esGerente, nombreUsuario, onClose, onSave }) {
  const buqueId = tarea.mant_equipos?.buque_id;
  const [fecha, setFecha] = useState(today());
  const [taller, setTaller] = useState("");
  const [remito, setRemito] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [horas, setHoras] = useState(null);
  const [horasLoading, setHorasLoading] = useState(true);
  const [ultimo, setUltimo] = useState(null);
  const [horasInput, setHorasInput] = useState("");
  const [editandoHoras, setEditandoHoras] = useState(false);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let vivo = true;
    setHorasLoading(true);
    setHorasInput("");
    setEditandoHoras(false);
    Promise.all([
      api.getHorasEnFecha(buqueId, tarea.equipo_id, fecha),
      api.getUltimoRegistro(buqueId, tarea.equipo_id, fecha),
    ]).then(([h, u]) => { if (vivo) { setHoras(h); setUltimo(u); setHorasLoading(false); } })
      .catch(() => { if (vivo) { setHoras(null); setUltimo(null); setHorasLoading(false); } });
    return () => { vivo = false; };
  }, [fecha]);

  const sinHoras = !horasLoading && horas === null;
  const puedeCargarHoras = ultimo ? fecha >= ultimo.fecha : esGerente;
  // Solo las tareas cuyo vencimiento se calcula por horas de funcionamiento
  // necesitan la lectura de horas para poder cumplirse; las que vencen por
  // fecha (ej: compás magnético) no dependen de eso y no deben bloquearse.
  const requiereHoras = tarea.tipo_frecuencia === "horas";
  const bloqueaGuardado = requiereHoras && sinHoras;

  const abrirEdicionHoras = () => {
    setHorasInput(!sinHoras ? String(Math.max(0, horas - (ultimo ? ultimo.horas : 0))) : "");
    setEditandoHoras(true);
  };

  const confirmarHoras = async () => {
    if (cargandoHoras) return;
    if (horasInput === "") { setEditandoHoras(false); return; }
    const ingresado = parseInt(horasInput);
    if (isNaN(ingresado) || ingresado < 0) return alert("Ingresá un valor de horas válido");
    let horasFinal;
    if (!ultimo) {
      horasFinal = ingresado;
    } else {
      const dias = Math.max(1, Math.round((new Date(fecha) - new Date(ultimo.fecha)) / 86400000));
      const maxPermitido = HORAS_MAX_POR_DIA * dias;
      if (ingresado > maxPermitido) return alert(`Supera el máximo de ${HORAS_MAX_POR_DIA} hs de funcionamiento por día.\n\nTope permitido: ${maxPermitido} hs (${dias} día/s desde el ${fmtDate(ultimo.fecha)}).`);
      horasFinal = ultimo.horas + ingresado;
    }
    setCargandoHoras(true);
    try {
      await api.registrarHoras([{ buque_id: buqueId, equipo_id: tarea.equipo_id, horas: horasFinal, fecha, registrado_por: nombreUsuario }]);
      setHoras(horasFinal);
      setHorasInput("");
      setEditandoHoras(false);
    } catch (e) { alert("Error: " + e.message); }
    finally { setCargandoHoras(false); }
  };

  const handleSave = async () => {
    if (!taller) return alert("Completá el taller interviniente");
    if (fecha > today()) return alert("No se puede registrar el cumplimiento con fecha futura. Elegí hoy o una fecha anterior.");
    if (horasLoading || bloqueaGuardado) return;
    setSaving(true);
    try {
      let adjunto_remito_url = "";
      if (archivo) {
        const tempId = `temp_${Date.now()}`;
        adjunto_remito_url = await api.subirAdjunto(archivo, tempId, "remitos");
      }
      await api.registrarEjecucion({
        tarea_id: tarea.id, buque_id: buqueId, fecha,
        horas_equipo: horas, realizado_por: taller, taller_interviniente: taller,
        numero_remito: remito, observaciones, adjunto_remito_url,
      });
      await api.actualizarTarea(tarea.id, { ultima_ejecucion_hs: horas, ultima_ejecucion_fecha: fecha });
      onSave();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">Cumplir tarea</div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">
          <div className="info-box mb12" style={{ fontSize: 12 }}>
            <strong>{tarea.descripcion}</strong><br />
            <span style={{ color: "var(--muted)", fontSize: 11 }}>{tarea.mant_equipos?.nombre} · Código: {tarea.codigo || "—"}</span>
          </div>
          <div className="form-grid">
            <FG label="Fecha de realización *">
              <input type="date" value={fecha} max={today()} onChange={e => setFecha(e.target.value)} />
            </FG>
            <FG label="Horas del equipo al momento del mantenimiento" full>
              {horasLoading ? (
                <input disabled value="Buscando..." />
              ) : editandoHoras ? (
                <div className={`flex-gap ${sinHoras ? "info-box danger" : ""}`} style={{ fontSize: 11 }}>
                  <span>{!ultimo ? "Horas del equipo:" : "Horas trabajadas ese día:"}</span>
                  <input type="number" min={0} autoFocus disabled={cargandoHoras}
                    value={horasInput} onChange={e => setHorasInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmarHoras()}
                    onBlur={confirmarHoras}
                    style={{ maxWidth: 120 }} />
                </div>
              ) : !sinHoras ? (
                <input readOnly value={`${horas} hs · click para corregir`}
                  style={{ cursor: "pointer" }} onClick={abrirEdicionHoras} />
              ) : !requiereHoras ? (
                puedeCargarHoras ? (
                  <div className="info-box" style={{ fontSize: 11, cursor: "pointer", textDecoration: "underline" }} onClick={abrirEdicionHoras}>
                    Este equipo no tiene horas cargadas para el {fmtDate(fecha)} — no hace falta para esta tarea. Click para cargarlas de todos modos (opcional).
                  </div>
                ) : (
                  <div className="info-box" style={{ fontSize: 11 }}>
                    Sin horas cargadas para esta fecha (no hace falta para esta tarea, que vence por fecha).
                  </div>
                )
              ) : !puedeCargarHoras ? (
                <div className="info-box danger" style={{ fontSize: 11 }}>
                  No hay horas cargadas de {tarea.mant_equipos?.nombre} para el {fmtDate(fecha)}.{" "}
                  {!ultimo
                    ? "La carga inicial de un equipo sin datos previos solo la puede hacer la gerencia."
                    : `No se pueden cargar horas para una fecha anterior al último registro (${fmtDate(ultimo.fecha)}).`}
                </div>
              ) : (
                <div className="info-box danger" style={{ fontSize: 11, cursor: "pointer", textDecoration: "underline" }} onClick={abrirEdicionHoras}>
                  No hay horas cargadas de {tarea.mant_equipos?.nombre} para el {fmtDate(fecha)}. Click para cargar las horas {!ultimo ? "iniciales" : "trabajadas ese día"}.
                </div>
              )}
            </FG>
            <FG label="Taller interviniente *"><input value={taller} onChange={e => setTaller(e.target.value)} placeholder="Ej: Taller Naval SRL" /></FG>
            <FG label="N° de remito"><input value={remito} onChange={e => setRemito(e.target.value)} placeholder="Ej: 0001-00012345" /></FG>
          </div>
          <FG label="Observaciones" full><textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Notas del trabajo realizado..." /></FG>
          <FG label="📎 Adjuntar remito" full>
            <input type="file" accept=".pdf,.jpg,.png" onChange={e => setArchivo(e.target.files[0])} style={{ fontSize: 12, padding: "6px 0" }} />
          </FG>
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || horasLoading || bloqueaGuardado}>{saving ? "Guardando..." : "Dar por cumplida"}</button>
        </div>
      </div>
    </div>
  );
}

// Cada cumplimiento se compara contra el anterior para ver si se cumplió a
// tiempo: por horas, contra horas_equipo + frecuencia_hs; por fecha, contra
// fecha + frecuencia (interpretada en días). El primero de la lista no tiene
// referencia previa, así que no se puede evaluar. Recibe ejecuciones en
// cualquier orden y devuelve más reciente primero.
function calcularCumplimientos(ejecuciones, tarea) {
  const ascendente = [...ejecuciones].sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
  const diasFrecuencia = tarea.tipo_frecuencia !== "horas" ? parseFrecuenciaDias(tarea.frecuencia_texto) : null;
  const conCumplimiento = ascendente.map((e, i) => {
    if (i === 0) return { ...e, cumplimiento: null };
    const prev = ascendente[i - 1];
    if (tarea.tipo_frecuencia === "horas" && tarea.frecuencia_hs && e.horas_equipo != null && prev.horas_equipo != null) {
      const diff = (prev.horas_equipo + tarea.frecuencia_hs) - e.horas_equipo;
      return { ...e, cumplimiento: { aTiempo: diff >= 0, valor: Math.abs(diff), unidad: "hs" } };
    }
    if (tarea.tipo_frecuencia !== "horas" && diasFrecuencia) {
      const diffDias = Math.round((new Date(addDays(prev.fecha, diasFrecuencia)) - new Date(e.fecha)) / 86400000);
      return { ...e, cumplimiento: { aTiempo: diffDias >= 0, valor: Math.abs(diffDias), unidad: "días" } };
    }
    return { ...e, cumplimiento: null };
  });
  return conCumplimiento.reverse();
}

//  MODAL: HISTORIAL DE CUMPLIMIENTO DE UNA TAREA
function HistorialTareaModal({ tarea, onClose }) {
  const [ejecuciones, setEjecuciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEjecucionesPorTarea(tarea.id).then(d => { setEjecuciones(d); setLoading(false); });
  }, [tarea.id]);

  const paraMostrar = calcularCumplimientos(ejecuciones, tarea);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">Historial de cumplimiento</div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">
          <div className="info-box mb12" style={{ fontSize: 12 }}>
            <strong>{tarea.descripcion}</strong><br />
            <span style={{ color: "var(--muted)", fontSize: 11 }}>{tarea.mant_equipos?.nombre} · Código: {tarea.codigo || "—"}</span>
          </div>
          {loading ? <div className="loading"><span className="spin">◌</span> Cargando...</div> :
            paraMostrar.length === 0 ? <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>Sin cumplimientos registrados</div> :
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Horas del equipo</th><th>Cumplimiento</th></tr></thead>
                <tbody>
                  {paraMostrar.map((e, i) => (
                    <tr key={i}>
                      <td className="text-mono" style={{ fontSize: 11 }}>{fmtDate(e.fecha)}</td>
                      <td className="text-mono" style={{ fontSize: 11, color: "var(--blue)" }}>{e.horas_equipo != null ? `${e.horas_equipo} hs` : "—"}</td>
                      <td>
                        {!e.cumplimiento ? <span style={{ color: "var(--muted2)", fontSize: 11 }}>—</span> : (
                          <span className={`badge ${e.cumplimiento.aTiempo ? "b-green" : "b-red"}`}>
                            {e.cumplimiento.aTiempo
                              ? `A tiempo (${e.cumplimiento.valor} ${e.cumplimiento.unidad} antes)`
                              : `Vencida (${e.cumplimiento.valor} ${e.cumplimiento.unidad} después)`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

//  MODAL: CORRECTIVO
function CorrectivoModal({ buqueId, equipos, correctivo, onClose, onSave }) {
  const [form, setForm] = useState({
    buque_id: buqueId, equipo_id: "", titulo: "", descripcion: "",
    prioridad: "normal", status: "abierto", fecha_deteccion: today(),
    fecha_resolucion: "", resuelto_por: "",
    ...(correctivo || {}),
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.titulo) return alert("El título es obligatorio");
    setSaving(true);
    try {
      correctivo ? await api.actualizarCorrectivo(correctivo.id, form) : await api.crearCorrectivo(form);
      onSave();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">{correctivo ? "Editar correctivo" : "Nuevo correctivo"}</div>
          <button className="mclose" onClick={onClose}>✕</button>
        </div>
        <div className="mbody">
          <div className="form-grid">
            <FG label="Título *" full><input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Descripción corta de la falla" /></FG>
            <FG label="Equipo">
              <select value={form.equipo_id} onChange={e => set("equipo_id", e.target.value)}>
                <option value="">Sin asignar</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </FG>
            <FG label="Prioridad">
              <select value={form.prioridad} onChange={e => set("prioridad", e.target.value)}>
                <option value="baja">Baja</option><option value="normal">Normal</option>
                <option value="alta">Alta</option><option value="critica">Crítica</option>
              </select>
            </FG>
            <FG label="Status">
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="abierto">Abierto</option><option value="en_proceso">En proceso</option><option value="resuelto">Resuelto</option>
              </select>
            </FG>
            <FG label="Fecha detección"><input type="date" value={form.fecha_deteccion} onChange={e => set("fecha_deteccion", e.target.value)} /></FG>
          </div>
          <FG label="Descripción" full><textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Detalle de la falla..." /></FG>
          {form.status === "resuelto" && <div className="form-grid mt12">
            <FG label="Fecha resolución"><input type="date" value={form.fecha_resolucion} onChange={e => set("fecha_resolucion", e.target.value)} /></FG>
            <FG label="Resuelto por"><input value={form.resuelto_por} onChange={e => set("resuelto_por", e.target.value)} /></FG>
          </div>}
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

//  MODAL: TAREA 
function TareaModal({ buqueId, equipos, esGerente, onClose, onSave }) {
  const [form, setForm] = useState({ equipo_id: "", codigo: "", descripcion: "", tipo_frecuencia: "horas", frecuencia_hs: "", frecuencia_texto: "", es_critica: false });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!esGerente) return alert("Solo la gerencia puede agregar tareas.");
    if (!form.equipo_id || !form.descripcion) return alert("Completá equipo y descripción");
    setSaving(true);
    try {
      await api.crearTarea({ ...form, frecuencia_hs: form.tipo_frecuencia === "horas" ? parseInt(form.frecuencia_hs) || null : null, frecuencia_texto: form.tipo_frecuencia !== "horas" ? form.frecuencia_texto : null });
      onSave();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mhdr"><div className="mtitle">Nueva tarea</div><button className="mclose" onClick={onClose}>✕</button></div>
        <div className="mbody">
          <div className="form-grid">
            <FG label="Equipo *">
              <select value={form.equipo_id} onChange={e => set("equipo_id", e.target.value)}>
                <option value="">Seleccionar...</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </FG>
            <FG label="Código"><input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="Ej: 10.01.09.01" /></FG>
            <FG label="Descripción *" full><input value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Ej: Cambio filtros de aceite" /></FG>
            <FG label="Tipo frecuencia">
              <select value={form.tipo_frecuencia} onChange={e => set("tipo_frecuencia", e.target.value)}>
                <option value="horas">Por horas</option><option value="tiempo">Por tiempo</option>
              </select>
            </FG>
            {form.tipo_frecuencia === "horas"
              ? <FG label="Frecuencia (hs)"><input type="number" value={form.frecuencia_hs} onChange={e => set("frecuencia_hs", e.target.value)} placeholder="Ej: 500" /></FG>
              : <FG label="Frecuencia (texto)"><input value={form.frecuencia_texto} onChange={e => set("frecuencia_texto", e.target.value)} placeholder="Ej: mensual" /></FG>
            }
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={form.es_critica} onChange={e => set("es_critica", e.target.checked)} style={{ accentColor: "var(--danger)" }} />
            <span>Marcar como crítica</span>
          </label>
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Crear tarea"}</button>
        </div>
      </div>
    </div>
  );
}

//  MODAL: EQUIPO 
function EquipoModal({ buqueId, esGerente, onClose, onSave }) {
  const [form, setForm] = useState({ buque_id: buqueId, codigo: "", nombre: "", sistema: "", sector: "MAQ", marca: "", modelo: "", nro_serie: "", activo: true });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!esGerente) return alert("Solo la gerencia puede agregar equipos.");
    if (!form.nombre) return alert("El nombre es obligatorio");
    setSaving(true);
    try { await api.crearEquipo(form); onSave(); }
    catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="mhdr"><div className="mtitle">Nuevo equipo</div><button className="mclose" onClick={onClose}>✕</button></div>
        <div className="mbody">
          <div className="form-grid">
            <FG label="Sector">
              <select value={form.sector} onChange={e => set("sector", e.target.value)}>
                <option value="MAQ">Máquinas</option><option value="CUB">Cubierta</option><option value="PUENTE">Puente</option>
              </select>
            </FG>
            <FG label="Código"><input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="Ej: 10.01" /></FG>
            <FG label="Nombre *" full><input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: MMPP N°1 MAK 8M 453 AK" /></FG>
            <FG label="Marca"><input value={form.marca} onChange={e => set("marca", e.target.value)} /></FG>
            <FG label="Modelo"><input value={form.modelo} onChange={e => set("modelo", e.target.value)} /></FG>
            <FG label="N° de Serie"><input value={form.nro_serie} onChange={e => set("nro_serie", e.target.value)} /></FG>
            <FG label="Sistema"><input value={form.sistema} onChange={e => set("sistema", e.target.value)} placeholder="Ej: Propulsión" /></FG>
          </div>
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Crear equipo"}</button>
        </div>
      </div>
    </div>
  );
}

//  PAGE: DASHBOARD 
function PageDashboard({ buque, notify }) {
  const [tareas, setTareas] = useState([]);
  const [horasMap, setHorasMap] = useState({});
  const [promedioMap, setPromedioMap] = useState({});
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEj, setModalEj] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, eq, hrs] = await Promise.all([api.getTareas(buque.id), api.getEquipos(buque.id), api.getUltimasHoras(buque.id)]);
      setTareas(t); setEquipos(eq); setHorasMap(hrs);
      // Calcular promedio por equipo
      const promMap = {};
      for (const eq of eq) {
        const prom = await api.getPromedioHorasDiarias(buque.id, eq.id);
        if (prom) promMap[eq.id] = prom;
      }
      setPromedioMap(promMap);
    } finally { setLoading(false); }
  }, [buque.id]);

  useEffect(() => { load(); }, [load]);

  const tareasConEstado = tareas
    .filter(t => t.tipo_frecuencia === "horas" && t.frecuencia_hs)
    .map(t => {
      const hs = horasMap[t.equipo_id] || 0;
      const estado = calcEstado(t, hs);
      const prom = promedioMap[t.equipo_id] || null;
      const forecastFecha = estado.restante > 0 ? calcForecastFecha(estado.restante, prom) : null;
      const hsVencimiento = (t.ultima_ejecucion_hs || 0) + t.frecuencia_hs;
      return { ...t, ...estado, horasActuales: hs, promedioHsDiarias: prom, forecastFecha, hsVencimiento };
    });

  const vencidas = tareasConEstado.filter(t => t.estado === "vencida");
  const proximas = tareasConEstado.filter(t => t.estado === "proxima");
  const ok = tareasConEstado.filter(t => t.estado === "ok");
  const filtradas = (filtro === "vencidas" ? vencidas : filtro === "proximas" ? proximas : filtro === "ok" ? ok : tareasConEstado)
    .sort((a, b) => ({ vencida: 0, proxima: 1, ok: 2, sin_datos: 3 }[a.estado] - ({ vencida: 0, proxima: 1, ok: 2, sin_datos: 3 }[b.estado])));

  if (loading) return <div className="loading"><span className="spin">◌</span> Cargando...</div>;

  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="stat-label">Total tareas</div><div className="stat-value" style={{ color: "var(--blue)" }}>{tareasConEstado.length}</div></div>
        <div className="stat"><div className="stat-label">Vencidas</div><div className="stat-value" style={{ color: "var(--danger)" }}>{vencidas.length}</div></div>
        <div className="stat"><div className="stat-label">Próx. vencimiento</div><div className="stat-value" style={{ color: "var(--warn)" }}>{proximas.length}</div></div>
        <div className="stat"><div className="stat-label">Al día</div><div className="stat-value" style={{ color: "var(--accent2)" }}>{ok.length}</div></div>
      </div>

      <div className="filter-row">
        {[["todos", "Todos"], ["vencidas", "Vencidos"], ["proximas", "Próximos"], ["ok", "Al día"]].map(([k, l]) => (
          <button key={k} className={`btn btn-sm ${filtro === k ? "btn-primary" : "btn-ghost"}`} onClick={() => setFiltro(k)}>{l}</button>
        ))}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{filtradas.length} tareas</span>
      </div>

      {filtradas.length === 0
        ? <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>{tareasConEstado.length === 0 ? "Cargá equipos, tareas y horas para ver el estado" : "Sin tareas en esta categoría"}</div>
        : filtradas.map(t => {
            const pctClass = t.estado === "vencida" ? "danger" : t.estado === "proxima" ? "warn" : "ok";
            const badgeClass = t.estado === "vencida" ? "b-red" : t.estado === "proxima" ? "b-amber" : "b-green";
            const restLabel = t.restante < 0 ? `Vencida hace ${Math.abs(Math.round(t.restante))} hs` : `Faltan ${Math.round(t.restante)} hs`;
            return (
              <div key={t.id} className={`alerta-row ${t.estado}`}>
                <div className="flex-between mb8">
                  <div className="flex-gap">
                    <span className={`badge ${badgeClass}`}>{t.estado === "vencida" ? "Vencida" : t.estado === "proxima" ? "Próxima" : "Al día"}</span>
                    {t.es_critica && <span className="badge b-red">Crítica</span>}
                  </div>
                  <div className="flex-gap">
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{restLabel}</span>
                    <button className="btn btn-success btn-sm" onClick={() => setModalEj(t)}>✓ Registrar</button>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)", marginBottom: 4 }}>{t.descripcion}</div>
                <div className="flex-gap mb8">
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{t.mant_equipos?.nombre}</span>
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>·</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Frec: {t.frecuencia_hs} hs</span>
                  <span style={{ fontSize: 10, color: "var(--muted2)" }}>·</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--blue)" }}>Actual: {t.horasActuales} hs</span>
                  {t.forecastFecha && (
                    <><span style={{ fontSize: 10, color: "var(--muted2)" }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--accent2)" }}>Vence aprox: {fmtDate(t.forecastFecha)}</span>
                    {t.promedioHsDiarias && <span style={{ fontSize: 10, color: "var(--muted2)" }}>({t.promedioHsDiarias} hs/día)</span>}</>
                  )}
                </div>
                <div className="pct-bar"><div className={`pct-fill ${pctClass}`} style={{ width: `${t.pct}%` }} /></div>
              </div>
            );
          })
      }

      {modalEj && (
        <EjecucionModal
          tarea={modalEj}
          buqueId={buque.id}
          horasActuales={horasMap[modalEj.equipo_id] || 0}
          horasVencimiento={modalEj.hsVencimiento}
          onClose={() => setModalEj(null)}
          onSave={() => { setModalEj(null); notify("Ejecución registrada", "success"); load(); }}
        />
      )}
    </div>
  );
}

//  PAGE: CARGA DE HORAS 
const HORAS_MAX_POR_DIA = 24;

function PageHoras({ buque, notify, esGerente, nombreUsuario }) {
  const [equipos, setEquipos] = useState([]);
  const [valores, setValores] = useState({});
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [fecha, setFecha] = useState(today());
  const [tab, setTab] = useState("carga");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eq, regs] = await Promise.all([api.getEquipos(buque.id), api.getRegistrosHoras(buque.id)]);
      setEquipos(eq); setRegistros(regs.slice(0, 100));
      setValores({});
    } finally { setLoading(false); }
  }, [buque.id]);

  useEffect(() => { load(); }, [load]);

  // Solo los equipos de la lista EQUIPOS_HORAS, en ese orden, con matching tolerante a variantes de nombre.
  const equiposHoras = EQUIPOS_HORAS
    .map(nombre => buscaEquipoPorNombre(equipos, nombre))
    .filter(Boolean);

  // Equipos de la lista que NO se pudieron matchear contra ninguno de los equipos cargados.
  const equiposHorasFaltantes = EQUIPOS_HORAS.filter(nombre => !buscaEquipoPorNombre(equipos, nombre));

  // Último registro (horas + fecha) por equipo: es la lectura actual del odómetro y la
  // base para no permitir cargar más de 24 hs de funcionamiento por día transcurrido.
  const ultimoPorEquipo = {};
  for (const r of registros) {
    if (!ultimoPorEquipo[r.equipo_id]) ultimoPorEquipo[r.equipo_id] = { horas: r.horas, fecha: r.fecha };
  }

  const handleGuardarEquipo = async (eq) => {
    const v = valores[eq.id];
    if (v === undefined || v === "") return alert("Ingresá un valor para " + eq.nombre);
    if (fecha > today()) return alert("No se puede cargar horas con fecha futura. Elegí hoy o una fecha anterior.");

    const ingresado = parseInt(v);
    const ultimo = ultimoPorEquipo[eq.id];
    let horas;

    if (!ultimo) {
      // Sin carga previa: lo ingresado es la lectura absoluta del horómetro (carga inicial),
      // reservada al gerente. La tripulación solo carga horas sobre una base ya existente.
      if (!esGerente) return alert(`${eq.nombre}: la carga inicial de un equipo sin datos previos solo la puede hacer la gerencia.`);
      horas = ingresado;
    } else {
      // Con carga previa: lo ingresado son las horas que funcionó ESE día, se suman al total.
      const dias = Math.max(1, Math.round((new Date(fecha) - new Date(ultimo.fecha)) / 86400000));
      const maxPermitido = HORAS_MAX_POR_DIA * dias;
      if (ingresado < 0) return alert(`${eq.nombre}: las horas trabajadas no pueden ser negativas.`);
      if (ingresado > maxPermitido) return alert(`${eq.nombre}: ${ingresado} hs supera el máximo de ${HORAS_MAX_POR_DIA} hs de funcionamiento por día.\n\nTope permitido: ${maxPermitido} hs (${dias} día/s desde la última carga, el ${fmtDate(ultimo.fecha)}).`);
      horas = ultimo.horas + ingresado;
    }

    setGuardandoId(eq.id);
    try {
      await api.registrarHoras([{ buque_id: buque.id, equipo_id: eq.id, horas, fecha, registrado_por: nombreUsuario }]);
      notify(`${eq.nombre}: horas registradas`, "success");
      load();
    } catch (e) { notify("Error: " + e.message, "error"); }
    finally { setGuardandoId(null); }
  };

  if (loading) return <div className="loading"><span className="spin">◌</span> Cargando...</div>;

  return (
    <div>
      <div className="tabs-row">
        <div className={`tab ${tab === "carga" ? "active" : ""}`} onClick={() => setTab("carga")}>Cargar horas</div>
        <div className={`tab ${tab === "historial" ? "active" : ""}`} onClick={() => setTab("historial")}>Historial de cargas</div>
      </div>

      {tab === "carga" && (
        <div className="card">
          <div className="card-title">
            Registro diario de horas
            <input type="date" value={fecha} max={today()} onChange={e => setFecha(e.target.value)}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "5px 10px", fontSize: 12, fontFamily: "var(--sans)", outline: "none", color: "var(--text)" }} />
          </div>
          <div className="info-box warn mb12" style={{ fontSize: 11 }}>
            Para un equipo con carga previa, ingresá las horas que funcionó ESE día (no el total acumulado — el sistema lo suma solo). Si es la primera carga de un equipo, ingresá la lectura actual del horómetro. No se admite cargar más de {HORAS_MAX_POR_DIA} hs de funcionamiento por cada día transcurrido desde la última carga.
          </div>
          {equiposHorasFaltantes.length > 0 && (
            <div className="info-box danger mb12" style={{ fontSize: 11 }}>
              No se encontraron en "Plan completo" estos equipos: {equiposHorasFaltantes.join(", ")}. Verificá que el nombre cargado en el equipo coincida (o contenga) ese texto.
            </div>
          )}
          {equiposHoras.length === 0
            ? <div className="empty-state">Ninguno de los equipos habilitados para carga de horas está creado en este buque. Revisá que los nombres en "Plan completo" coincidan con: {EQUIPOS_HORAS.join(", ")}.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {equiposHoras.map(eq => {
                  const ultimo = ultimoPorEquipo[eq.id];
                  const bloqueado = !ultimo && !esGerente;
                  return (
                    <div key={eq.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 10, color: "var(--navy)", letterSpacing: ".5px", textTransform: "uppercase", fontWeight: 600 }}>{eq.nombre}</label>
                      <span style={{ fontSize: 11, color: bloqueado ? "var(--danger)" : "var(--muted)" }}>
                        {ultimo ? `Actual: ${ultimo.horas} hs (${fmtDate(ultimo.fecha)})`
                          : bloqueado ? "Sin carga previa — la carga inicial la hace la gerencia"
                          : "Sin carga previa — ingresar hora inicial"}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input type="number" className="hs-input" placeholder={ultimo ? "Hs de hoy" : "Hora inicial"} value={valores[eq.id] || ""}
                          disabled={bloqueado} title={bloqueado ? "La carga inicial la hace la gerencia" : ""}
                          onChange={e => setValores(v => ({ ...v, [eq.id]: e.target.value }))} />
                        <button className="btn btn-primary btn-sm" onClick={() => handleGuardarEquipo(eq)}
                          disabled={bloqueado || guardandoId === eq.id || !valores[eq.id]}>
                          {guardandoId === eq.id ? "..." : "Guardar"}
                        </button>
                      </div>
                      {ultimo && valores[eq.id] && (
                        <span style={{ fontSize: 10, color: "var(--muted2)" }}>Nuevo total: {ultimo.horas + (parseInt(valores[eq.id]) || 0)} hs</span>
                      )}
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {tab === "historial" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Equipo</th><th>Horas</th><th>Registrado por</th></tr></thead>
              <tbody>
                {registros.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Sin registros</td></tr>
                  : registros.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{fmtDate(r.fecha)}</td>
                      <td style={{ fontSize: 12 }}>{r.mant_equipos?.nombre || "—"}</td>
                      <td className="text-mono" style={{ fontSize: 12, color: "var(--blue)", fontWeight: 600 }}>{r.horas} hs</td>
                      <td style={{ fontSize: 11, color: "var(--muted)" }}>{r.registrado_por || "—"}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

//  PAGE: KPIs 
function PageKPIs({ buque }) {
  const [ejecuciones, setEjecuciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEjecuciones(buque.id).then(d => { setEjecuciones(d); setLoading(false); });
  }, [buque.id]);

  if (loading) return <div className="loading"><span className="spin">◌</span> Cargando...</div>;

  const fueraTerm = ejecuciones.filter(e => e.fue_fuera_termino);
  const enTerm = ejecuciones.filter(e => !e.fue_fuera_termino);
  const pctFuera = ejecuciones.length ? Math.round(fueraTerm.length / ejecuciones.length * 100) : 0;
  const conMatriz = fueraTerm.filter(e => e.adjunto_riesgo_url);

  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="stat-label">Total ejecuciones</div><div className="stat-value" style={{ color: "var(--blue)" }}>{ejecuciones.length}</div></div>
        <div className="stat"><div className="stat-label">En término</div><div className="stat-value" style={{ color: "var(--accent2)" }}>{enTerm.length}</div></div>
        <div className="stat"><div className="stat-label">Fuera de término</div><div className="stat-value" style={{ color: "var(--danger)" }}>{fueraTerm.length}</div></div>
        <div className="stat"><div className="stat-label">% fuera de término</div><div className="stat-value" style={{ color: pctFuera > 20 ? "var(--danger)" : pctFuera > 10 ? "var(--warn)" : "var(--accent2)" }}>{pctFuera}%</div></div>
      </div>

      {fueraTerm.length > 0 && (
        <div className="card">
          <div className="card-title">Ejecuciones fuera de término</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Tarea</th><th>Equipo</th><th>Días atraso</th><th>Realizado por</th><th>Matriz riesgo</th></tr></thead>
              <tbody>
                {fueraTerm.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{fmtDate(e.fecha)}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{e.mant_tareas?.descripcion}</td>
                    <td style={{ fontSize: 11, color: "var(--muted)" }}>{e.mant_tareas?.mant_equipos?.nombre}</td>
                    <td><span className="badge b-red">{e.dias_fuera_termino || "—"} días</span></td>
                    <td style={{ fontSize: 11 }}>{e.realizado_por || "—"}</td>
                    <td>
                      {e.adjunto_riesgo_url
                        ? <a href={e.adjunto_riesgo_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--blue)", textDecoration: "none" }}>Ver PDF</a>
                        : <span style={{ fontSize: 11, color: "var(--muted2)" }}>Sin adjunto</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ejecuciones.length === 0 && <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>Sin ejecuciones registradas aún</div>}
    </div>
  );
}

//  PAGE: PLAN (árbol jerárquico por código, ej: 10 MMPP → 10.01 MMPP N°1 → 10.01.01 Sist. inyección → tareas)
function compararCodigos(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? -1, nb = pb[i] ?? -1;
    if (na !== nb) return na - nb;
  }
  return 0;
}

// Agrupa las tareas bajo los nodos de TAXONOMIA_TECNICA cuyo código es prefijo
// (por punto) del código de la tarea. Una tarea sin código, o cuyo código no
// nidea bajo ningún nodo conocido, va a "otras" agrupada por equipo.
// Códigos cuyo padre no se puede inferir por prefijo de punto porque el Excel los
// numera como "hermanos" en vez de anidarlos (71/72 bajo 70 PURIFICADORAS,
// 81-89 y 810-816 bajo 80 BOMBAS).
const PADRE_MANUAL = {
  "71": "70", "72": "70",
  "81": "80", "82": "80", "83": "80", "84": "80", "85": "80", "86": "80", "87": "80", "88": "80", "89": "80",
  "810": "80", "811": "80", "812": "80", "813": "80", "814": "80", "815": "80", "816": "80",
};

function construirArbolTareas(tareas) {
  const taxKeys = Object.keys(TAXONOMIA_TECNICA);
  const raiz = new Map();
  const otras = new Map();

  const getOrCreate = (mapa, codigo) => {
    if (!mapa.has(codigo)) mapa.set(codigo, { codigo, label: TAXONOMIA_TECNICA[codigo] || codigo, children: new Map(), tareas: [] });
    return mapa.get(codigo);
  };

  for (const t of tareas) {
    const codigo = (t.codigo || "").trim();
    const cadena = codigo && codigo !== "—"
      ? taxKeys.filter(k => k !== codigo && codigo.startsWith(k + ".")).sort((a, b) => a.split(".").length - b.split(".").length)
      : [];
    const padreManual = PADRE_MANUAL[codigo.split(".")[0]];
    if (padreManual) cadena.unshift(padreManual);
    if (cadena.length === 0) {
      const nombreEq = t.mant_equipos?.nombre || "Sin equipo";
      if (!otras.has(nombreEq)) otras.set(nombreEq, []);
      otras.get(nombreEq).push(t);
      continue;
    }
    let mapaActual = raiz, nodo = null;
    for (const key of cadena) { nodo = getOrCreate(mapaActual, key); mapaActual = nodo.children; }
    nodo.tareas.push(t);
  }
  return { raiz, otras };
}

function contarTareas(nodo) {
  let total = nodo.tareas.length;
  for (const hijo of nodo.children.values()) total += contarTareas(hijo);
  return total;
}

// Recorre el árbol acumulando las tareas efectivamente seleccionadas: si un
// nodo (equipo/subsistema) está en `seleccionados`, todas sus tareas y las de
// sus hijos entran aunque no estén individualmente marcadas.
function recolectarSeleccionadas(nodo, heredado, seleccionados, out) {
  const efectivo = heredado || seleccionados.has(nodo.codigo);
  for (const t of nodo.tareas) {
    if (efectivo || seleccionados.has(t.id)) out.push(t);
  }
  for (const hijo of nodo.children.values()) recolectarSeleccionadas(hijo, efectivo, seleccionados, out);
}

function FilaTarea({ t, ESTADO_BADGE, ESTADO_LABEL, notify, reload, esGerente, nombreUsuario, modoSeleccion, seleccionados, onToggleSeleccion, heredado }) {
  const [modalCumplir, setModalCumplir] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const seleccionado = heredado || seleccionados?.has(t.id);
  return (
    <tr>
      {modoSeleccion && (
        <td>
          <input type="checkbox" checked={!!seleccionado} disabled={heredado} onChange={() => onToggleSeleccion(t.id)} />
        </td>
      )}
      <td className="text-mono" style={{ fontSize: 10, color: "var(--muted)" }}>{t.codigo || "—"}</td>
      <td style={{ fontSize: 12 }}>{t.descripcion}</td>
      <td className="text-mono" style={{ fontSize: 11, color: "var(--blue)" }}>{t.tipo_frecuencia === "horas" ? `${t.frecuencia_hs} hs` : t.frecuencia_texto}</td>
      <td className="text-mono" style={{ fontSize: 11, color: "var(--muted)" }}>{t.tipo_frecuencia === "horas" ? `${t.horasActuales} hs` : "—"}</td>
      <td className="text-mono" style={{ fontSize: 11, fontWeight: 600, color: t.estado === "vencida" ? "var(--danger)" : t.estado === "proxima" ? "var(--warn)" : "var(--muted)" }}>
        {t.tipo_frecuencia !== "horas" ? (t.ultima_ejecucion_fecha ? fmtDate(t.ultima_ejecucion_fecha) : "—")
          : t.estado === "sin_datos" ? "—"
          : t.restante < 0 ? `Vencida hace ${Math.abs(Math.round(t.restante))} hs`
          : `Faltan ${Math.round(t.restante)} hs`}
      </td>
      <td>{t.tipo_frecuencia === "horas" ? <span className={`badge ${ESTADO_BADGE[t.estado]}`}>{ESTADO_LABEL[t.estado]}</span> : <span style={{ color: "var(--muted2)", fontSize: 11 }}>Por fecha</span>}</td>
      <td>{t.es_critica ? <span className="badge b-red">Sí</span> : <span style={{ color: "var(--muted2)", fontSize: 11 }}>—</span>}</td>
      <td className="flex-gap">
        <button className="btn btn-success btn-sm" onClick={() => setModalCumplir(true)}>✓ Cumplir</button>
        <button className="btn btn-ghost btn-sm" title="Historial de cumplimiento" onClick={() => setModalHistorial(true)}>🕘</button>
      </td>
      {modalCumplir && createPortal(
        <CumplirTareaModal tarea={t} esGerente={esGerente} nombreUsuario={nombreUsuario} onClose={() => setModalCumplir(false)}
          onSave={() => { setModalCumplir(false); notify?.("Tarea dada por cumplida", "success"); reload?.(); }} />,
        document.body
      )}
      {modalHistorial && createPortal(
        <HistorialTareaModal tarea={t} onClose={() => setModalHistorial(false)} />,
        document.body
      )}
    </tr>
  );
}

function TablaTareas({ tareas, ESTADO_BADGE, ESTADO_LABEL, notify, reload, esGerente, nombreUsuario, modoSeleccion, seleccionados, onToggleSeleccion, heredado }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{modoSeleccion && <th></th>}<th>Código</th><th>Descripción</th><th>Frecuencia</th><th>Horas actuales</th><th>Restante</th><th>Estado</th><th>Crítica</th><th></th></tr></thead>
        <tbody>{tareas.map(t => <FilaTarea key={t.id} t={t} ESTADO_BADGE={ESTADO_BADGE} ESTADO_LABEL={ESTADO_LABEL} notify={notify} reload={reload} esGerente={esGerente} nombreUsuario={nombreUsuario} modoSeleccion={modoSeleccion} seleccionados={seleccionados} onToggleSeleccion={onToggleSeleccion} heredado={heredado} />)}</tbody>
      </table>
    </div>
  );
}

function NodoArbol({ nodo, depth, expandido, alternar, forzarAbierto, ESTADO_BADGE, ESTADO_LABEL, notify, reload, esGerente, nombreUsuario, modoSeleccion, seleccionados, onToggleSeleccion, heredado }) {
  const abierto = forzarAbierto || expandido.has(nodo.codigo);
  const hijos = [...nodo.children.values()].sort((a, b) => compararCodigos(a.codigo, b.codigo));
  const seleccionado = heredado || seleccionados?.has(nodo.codigo);
  return (
    <div className="arbol-nodo">
      <div style={{ display: "flex", alignItems: "center" }}>
        {modoSeleccion && (
          <input type="checkbox" checked={!!seleccionado} disabled={heredado}
            onChange={() => onToggleSeleccion(nodo.codigo)}
            style={{ marginLeft: 12 + depth * 20, flexShrink: 0 }} />
        )}
        <button className="arbol-fila" style={{ paddingLeft: modoSeleccion ? 8 : 12 + depth * 20, flex: 1 }} onClick={() => alternar(nodo.codigo)}>
          <span className="arbol-caret">{abierto ? "▾" : "▸"}</span>
          <span className="arbol-codigo">{nodo.codigo}</span>
          <span className="arbol-label">{nodo.label}</span>
          <span className="arbol-count">{contarTareas(nodo)}</span>
        </button>
      </div>
      {abierto && (
        <div>
          {hijos.map(hijo => (
            <NodoArbol key={hijo.codigo} nodo={hijo} depth={depth + 1} expandido={expandido} alternar={alternar} forzarAbierto={forzarAbierto} ESTADO_BADGE={ESTADO_BADGE} ESTADO_LABEL={ESTADO_LABEL} notify={notify} reload={reload} esGerente={esGerente} nombreUsuario={nombreUsuario} modoSeleccion={modoSeleccion} seleccionados={seleccionados} onToggleSeleccion={onToggleSeleccion} heredado={!!seleccionado} />
          ))}
          {nodo.tareas.length > 0 && (
            <div style={{ paddingLeft: 12 + (depth + 1) * 20 }}>
              <TablaTareas tareas={nodo.tareas} ESTADO_BADGE={ESTADO_BADGE} ESTADO_LABEL={ESTADO_LABEL} notify={notify} reload={reload} esGerente={esGerente} nombreUsuario={nombreUsuario} modoSeleccion={modoSeleccion} seleccionados={seleccionados} onToggleSeleccion={onToggleSeleccion} heredado={!!seleccionado} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AZUL_PL = [0, 34, 71]; // #002247, azul institucional de PL Offshore
const DORADO_PL = [248, 188, 5]; // #F8BC05
const GRIS_CLARO = [245, 247, 249];
const CELESTE_CLARO = [223, 238, 250];
const GRIS_TEXTO = [110, 120, 130];

// Carga una imagen pública (ej: /pl-offshore-wordmark.png) y la devuelve como
// data URL para incrustarla con doc.addImage. El PNG del logo tiene fondo
// blanco opaco (no transparente), así que se usa siempre en sus colores
// originales, sobre una tarjeta blanca cuando el fondo detrás es oscuro.
function cargarImagenDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL("image/png"), width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Dibuja el logo (en sus colores originales) dentro de una tarjeta blanca
// redondeada, del alto indicado, con esquina superior izquierda en (x, y).
function dibujarLogoEnTarjeta(doc, logo, x, y, alto) {
  const w = alto * (logo.width / logo.height);
  const pad = alto * 0.18;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w + pad * 2, alto + pad * 2, 2, 2, "F");
  doc.addImage(logo.dataUrl, "PNG", x + pad, y + pad, w, alto);
  return w + pad * 2;
}

// Dibuja el encabezado fijo (fondo azul + logo + título + buque) en la parte
// superior de una página de contenido. Se suscribe al evento "addPage" de
// jsPDF así se redibuja solo, tanto en los saltos de página manuales como en
// los que genera autoTable al partir una tabla larga.
function dibujarEncabezado(doc, buque, logo, pageWidth) {
  doc.setFillColor(...AZUL_PL);
  doc.rect(0, 0, pageWidth, 24, "F");
  if (logo) dibujarLogoEnTarjeta(doc, logo, 10, 5, 10);
  doc.setTextColor(255, 255, 255).setFontSize(11).setFont(undefined, "bold");
  doc.text("REPORTE DE MANTENIMIENTO", pageWidth - 12, 11, { align: "right" });
  doc.setFontSize(9).setFont(undefined, "normal");
  doc.text(buque.nombre, pageWidth - 12, 17, { align: "right" });
  doc.setTextColor(0);
}

const ESTILO_TABLA = {
  headStyles: { fillColor: AZUL_PL, textColor: 255, fontStyle: "bold", fontSize: 9 },
  bodyStyles: { fillColor: CELESTE_CLARO },
  styles: { fontSize: 9, cellPadding: 3, textColor: [40, 45, 50] },
};

// Genera y descarga el PDF del reporte: carátula, resumen de horas actuales
// de los equipos involucrados, y el historial de cada tarea seleccionada
// (recortado según el modo elegido: última vez / desde una fecha / últimas N).
async function generarReportePDF({ buque, tareas, horasMap, modo, valorModo }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let logo = null;
  try { logo = await cargarImagenDataUrl("/pl-offshore-wordmark.png"); } catch { /* sin logo */ }

  // Página 1: carátula, toda azul.
  doc.setFillColor(...AZUL_PL);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...DORADO_PL);
  doc.rect(0, pageHeight / 2 + 30, pageWidth, 1.5, "F");
  if (logo) {
    const logoAlto = 26;
    const anchoTarjeta = logoAlto * (logo.width / logo.height) + logoAlto * 0.36;
    dibujarLogoEnTarjeta(doc, logo, (pageWidth - anchoTarjeta) / 2, pageHeight / 2 - 55, logoAlto);
  }
  doc.setTextColor(255, 255, 255).setFontSize(24).setFont(undefined, "bold");
  doc.text("REPORTE DE MANTENIMIENTO", pageWidth / 2, pageHeight / 2 + 20, { align: "center" });
  doc.setFontSize(14).setFont(undefined, "normal");
  doc.text(buque.nombre, pageWidth / 2, pageHeight / 2 + 30, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(200, 210, 225);
  doc.text(`Generado el ${fmtDate(today())}`, pageWidth / 2, pageHeight / 2 + 42, { align: "center" });
  doc.setTextColor(0);

  // A partir de aquí, toda página nueva (manual o de autoTable) lleva el
  // encabezado fijo con la misma info de la carátula.
  doc.internal.events.subscribe("addPage", () => dibujarEncabezado(doc, buque, logo, pageWidth));

  doc.addPage();
  doc.setTextColor(...AZUL_PL).setFontSize(15).setFont(undefined, "bold");
  doc.text("Resumen de horas actuales", 14, 34);
  doc.setTextColor(...GRIS_TEXTO).setFontSize(9).setFont(undefined, "normal");
  doc.text("Equipos seleccionados que llevan horas de funcionamiento", 14, 40);
  doc.setTextColor(0);
  const equipoIds = [...new Set(tareas.map(t => t.equipo_id))];
  const filasHoras = equipoIds
    .filter(id => horasMap[id] != null)
    .map(id => {
      const t = tareas.find(x => x.equipo_id === id);
      return [t?.mant_equipos?.nombre || id, `${horasMap[id]} hs`];
    });
  if (filasHoras.length) {
    autoTable(doc, { startY: 45, head: [["Equipo", "Horas actuales"]], body: filasHoras, margin: { top: 26 }, ...ESTILO_TABLA });
  } else {
    doc.setFontSize(10).setFont(undefined, "normal").setTextColor(...GRIS_TEXTO);
    doc.text("Ninguno de los equipos seleccionados lleva horas de funcionamiento.", 14, 50);
    doc.setTextColor(0);
  }

  const ejecucionesTodas = tareas.length ? await api.getEjecucionesPorTareas(tareas.map(t => t.id)) : [];
  const porTarea = {};
  for (const e of ejecucionesTodas) (porTarea[e.tarea_id] ??= []).push(e);

  doc.addPage();
  doc.setTextColor(...AZUL_PL).setFontSize(15).setFont(undefined, "bold");
  doc.text("Historial de cumplimiento", 14, 34);
  doc.setTextColor(...GRIS_TEXTO).setFontSize(9).setFont(undefined, "normal");
  doc.text(`${tareas.length} tarea${tareas.length !== 1 ? "s" : ""} incluida${tareas.length !== 1 ? "s" : ""}`, 14, 40);
  doc.setTextColor(0);
  let y = 50;
  let equipoAnterior = null;

  for (const t of tareas) {
    if (t.equipo_id !== equipoAnterior) {
      if (y > pageHeight - 40) { doc.addPage(); y = 32; }
      else if (equipoAnterior !== null) y += 4;
      doc.setFillColor(...GRIS_CLARO);
      doc.rect(10, y - 7, pageWidth - 20, 11, "F");
      doc.setFillColor(...DORADO_PL);
      doc.rect(10, y - 7, 2, 11, "F");
      doc.setTextColor(...AZUL_PL).setFontSize(14).setFont(undefined, "bold");
      doc.text(t.mant_equipos?.nombre || "Equipo sin nombre", 16, y);
      doc.setTextColor(0);
      y += 12;
      equipoAnterior = t.equipo_id;
    }

    let ejec = calcularCumplimientos(porTarea[t.id] || [], t);
    if (modo === "ultima") ejec = ejec.slice(0, 1);
    else if (modo === "desde") ejec = ejec.filter(e => e.fecha >= valorModo);
    else if (modo === "ultimasN") ejec = ejec.slice(0, valorModo);

    if (y > pageHeight - 30) { doc.addPage(); y = 32; }
    doc.setFillColor(...AZUL_PL);
    doc.rect(10, y - 5, pageWidth - 20, 8, "F");
    doc.setFontSize(10).setFont(undefined, "bold").setTextColor(255, 255, 255);
    doc.text(`${t.codigo || "s/código"} · ${t.descripcion}`, 14, y);
    doc.setTextColor(0);
    y += 8;

    if (ejec.length === 0) {
      doc.setFontSize(9).setFont(undefined, "normal").setTextColor(...GRIS_TEXTO);
      doc.text("Sin cumplimientos registrados", 14, y);
      doc.setTextColor(0);
      y += 10;
      continue;
    }

    const filas = ejec.map(e => [
      fmtDate(e.fecha),
      e.horas_equipo != null ? `${e.horas_equipo} hs` : "—",
      !e.cumplimiento ? "—" : (e.cumplimiento.aTiempo
        ? `A tiempo (${e.cumplimiento.valor} ${e.cumplimiento.unidad} antes)`
        : `Vencida (${e.cumplimiento.valor} ${e.cumplimiento.unidad} después)`),
    ]);
    autoTable(doc, {
      startY: y, head: [["Fecha", "Horas del equipo", "Cumplimiento"]], body: filas,
      margin: { left: 14, right: 14, top: 26 },
      ...ESTILO_TABLA,
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const val = data.cell.raw;
          if (typeof val === "string" && val.startsWith("Vencida")) data.cell.styles.textColor = [180, 40, 40];
          else if (typeof val === "string" && val.startsWith("A tiempo")) data.cell.styles.textColor = [30, 120, 90];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 2; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFontSize(8).setFont(undefined, "normal").setTextColor(...GRIS_TEXTO);
    doc.text(`Página ${p - 1} de ${totalPaginas - 1}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    doc.setTextColor(0);
  }

  doc.save(`reporte-mantenimiento-${buque.nombre.replace(/\s+/g, "_")}-${today()}.pdf`);
}

//  MODAL: FILTRO DE HISTORIAL PARA EL REPORTE
function ReporteFiltroModal({ cantidad, onClose, onConfirm }) {
  const [modo, setModo] = useState("ultima");
  const [fechaDesde, setFechaDesde] = useState(today());
  const [cantidadN, setCantidadN] = useState(4);
  const [generando, setGenerando] = useState(false);

  const handleConfirm = async () => {
    setGenerando(true);
    try {
      await onConfirm(modo, modo === "desde" ? fechaDesde : modo === "ultimasN" ? (parseInt(cantidadN) || 1) : null);
      onClose();
    } catch (e) { alert("Error: " + e.message); }
    finally { setGenerando(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && !generando && onClose()}>
      <div className="modal">
        <div className="mhdr">
          <div className="mtitle">Generar reporte</div>
          <button className="mclose" onClick={onClose} disabled={generando}>✕</button>
        </div>
        <div className="mbody">
          <div className="info-box mb12" style={{ fontSize: 12 }}>{cantidad} tarea{cantidad !== 1 ? "s" : ""} seleccionada{cantidad !== 1 ? "s" : ""}</div>
          <div className="form-section">¿Qué historial incluir?</div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", cursor: "pointer" }}>
            <input type="radio" name="modoReporte" checked={modo === "ultima"} onChange={() => setModo("ultima")} />
            Solo la última vez que se realizó cada tarea
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", cursor: "pointer" }}>
            <input type="radio" name="modoReporte" checked={modo === "desde"} onChange={() => setModo("desde")} />
            Desde una fecha en particular
          </label>
          {modo === "desde" && (
            <div style={{ paddingLeft: 26, marginBottom: 8 }}>
              <input type="date" value={fechaDesde} max={today()} onChange={e => setFechaDesde(e.target.value)} />
            </div>
          )}
          <label style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", cursor: "pointer" }}>
            <input type="radio" name="modoReporte" checked={modo === "ultimasN"} onChange={() => setModo("ultimasN")} />
            Las últimas
            <input type="number" min={1} value={cantidadN} disabled={modo !== "ultimasN"}
              onChange={e => setCantidadN(e.target.value)} style={{ width: 60 }} />
            veces que se realizó cada tarea
          </label>
        </div>
        <div className="mftr">
          <button className="btn btn-ghost" onClick={onClose} disabled={generando}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={generando}>{generando ? "Generando..." : "⬇ Descargar PDF"}</button>
        </div>
      </div>
    </div>
  );
}

function PagePlan({ buque, notify, esGerente, nombreUsuario }) {
  const [tareas, setTareas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [horasMap, setHorasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalTarea, setModalTarea] = useState(false);
  const [modalEquipo, setModalEquipo] = useState(false);
  const [filtroSector, setFiltroSector] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(() => new Set());
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState(() => new Set());
  const [modalReporte, setModalReporte] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, eq, hrs] = await Promise.all([api.getTareas(buque.id), api.getEquipos(buque.id), api.getUltimasHoras(buque.id)]);
      setTareas(t); setEquipos(eq); setHorasMap(hrs);
    } finally { setLoading(false); }
  }, [buque.id]);

  useEffect(() => { load(); }, [load]);

  // Cada tarea de tipo "horas" queda linqueada a las horas cargadas de su equipo
  // (mant_registros_horas, vía equipo_id) para mostrar cuánto falta para el vencimiento.
  const tareasConEstado = tareas.map(t => {
    if (t.tipo_frecuencia === "horas" && t.frecuencia_hs) {
      const horasActuales = horasMap[t.equipo_id] || 0;
      const estado = calcEstado(t, horasActuales);
      return { ...t, horasActuales, ...estado };
    }
    return { ...t, horasActuales: null, estado: null, restante: null, pct: 0 };
  });

  const sectores = [...new Set(equipos.map(e => e.sector).filter(Boolean))].sort();
  const filtradas = tareasConEstado.filter(t => {
    if (filtroSector && t.mant_equipos?.sector !== filtroSector) return false;
    if (busqueda && !t.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) && !t.codigo?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const { raiz, otras } = useMemo(() => construirArbolTareas(filtradas), [filtradas]);
  const gruposRaiz = [...raiz.values()].sort((a, b) => compararCodigos(a.codigo, b.codigo));
  const gruposOtras = [...otras.entries()];
  // Con búsqueda o filtro de sector activos, se fuerzan todas las ramas abiertas
  // para no obligar a desplegar manualmente hasta encontrar el resultado.
  const forzarAbierto = Boolean(busqueda || filtroSector);

  const alternar = (codigo) => setExpandido(prev => {
    const next = new Set(prev);
    if (next.has(codigo)) next.delete(codigo); else next.add(codigo);
    return next;
  });

  const onToggleSeleccion = (key) => setSeleccionados(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const cancelarSeleccion = () => { setModoSeleccion(false); setSeleccionados(new Set()); };

  const tareasSeleccionadas = useMemo(() => {
    const out = [];
    for (const nodo of gruposRaiz) recolectarSeleccionadas(nodo, false, seleccionados, out);
    for (const [nombreEq, ts] of gruposOtras) {
      const efectivo = seleccionados.has(`otras:${nombreEq}`);
      for (const t of ts) if (efectivo || seleccionados.has(t.id)) out.push(t);
    }
    return out;
  }, [gruposRaiz, gruposOtras, seleccionados]);

  const handleGenerarReporte = async (modo, valorModo) => {
    await generarReportePDF({ buque, tareas: tareasSeleccionadas, horasMap, modo, valorModo });
    cancelarSeleccion();
  };

  const ESTADO_BADGE = { vencida: "b-red", proxima: "b-amber", ok: "b-green", sin_datos: "b-gray" };
  const ESTADO_LABEL = { vencida: "Vencida", proxima: "Próxima", ok: "Al día", sin_datos: "Sin horas cargadas" };

  return (
    <div>
      <div className="filter-row">
        <input className="filter-input" placeholder=" Buscar tarea..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="filter-select" value={filtroSector} onChange={e => setFiltroSector(e.target.value)}>
          <option value="">Todos los sectores</option>
          {sectores.map(s => <option key={s}>{s}</option>)}
        </select>
        {(busqueda || filtroSector) && <button className="btn btn-ghost btn-sm" onClick={() => { setBusqueda(""); setFiltroSector(""); }}>✕ Limpiar</button>}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{filtradas.length} tareas</span>
        {esGerente && <button className="btn btn-primary btn-sm" onClick={() => setModalEquipo(true)}>+ Equipo</button>}
        {esGerente && <button className="btn btn-primary btn-sm" onClick={() => setModalTarea(true)}>+ Tarea</button>}
      </div>
      {loading ? <div className="loading"><span className="spin">◌</span> Cargando...</div> :
        filtradas.length === 0 ? <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>Sin tareas</div> :
        <div className="card arbol" style={{ padding: 0 }}>
          {gruposRaiz.map(nodo => (
            <NodoArbol key={nodo.codigo} nodo={nodo} depth={0} expandido={expandido} alternar={alternar} forzarAbierto={forzarAbierto} ESTADO_BADGE={ESTADO_BADGE} ESTADO_LABEL={ESTADO_LABEL} notify={notify} reload={load} esGerente={esGerente} nombreUsuario={nombreUsuario} modoSeleccion={modoSeleccion} seleccionados={seleccionados} onToggleSeleccion={onToggleSeleccion} heredado={false} />
          ))}
          {gruposOtras.map(([nombreEq, ts]) => {
            const codigoOtras = `otras:${nombreEq}`;
            const abierto = forzarAbierto || expandido.has(codigoOtras);
            const seleccionadoOtras = seleccionados.has(codigoOtras);
            return (
              <div className="arbol-nodo" key={codigoOtras}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {modoSeleccion && (
                    <input type="checkbox" checked={seleccionadoOtras} style={{ marginLeft: 12 }}
                      onChange={() => onToggleSeleccion(codigoOtras)} />
                  )}
                  <button className="arbol-fila" style={{ paddingLeft: modoSeleccion ? 8 : 12, flex: 1 }} onClick={() => alternar(codigoOtras)}>
                    <span className="arbol-caret">{abierto ? "▾" : "▸"}</span>
                    <span className="arbol-label">{nombreEq} — otras tareas sin código jerárquico</span>
                    <span className="arbol-count">{ts.length}</span>
                  </button>
                </div>
                {abierto && <div style={{ paddingLeft: 32 }}><TablaTareas tareas={ts} ESTADO_BADGE={ESTADO_BADGE} ESTADO_LABEL={ESTADO_LABEL} notify={notify} reload={load} esGerente={esGerente} nombreUsuario={nombreUsuario} modoSeleccion={modoSeleccion} seleccionados={seleccionados} onToggleSeleccion={onToggleSeleccion} heredado={seleccionadoOtras} /></div>}
              </div>
            );
          })}
        </div>
      }
      {!loading && filtradas.length > 0 && (
        <div className="flex-gap" style={{ marginTop: 12 }}>
          {!modoSeleccion ? (
            <button className="btn btn-primary btn-sm" onClick={() => setModoSeleccion(true)}>⬇ Descargar reporte</button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={cancelarSeleccion}>Cancelar selección</button>
              <button className="btn btn-primary btn-sm" disabled={tareasSeleccionadas.length === 0} onClick={() => setModalReporte(true)}>
                Generar reporte ({tareasSeleccionadas.length} tarea{tareasSeleccionadas.length !== 1 ? "s" : ""})
              </button>
            </>
          )}
        </div>
      )}
      {modalTarea && <TareaModal buqueId={buque.id} equipos={equipos} esGerente={esGerente} onClose={() => setModalTarea(false)} onSave={() => { setModalTarea(false); notify("Tarea creada", "success"); load(); }} />}
      {modalEquipo && <EquipoModal buqueId={buque.id} esGerente={esGerente} onClose={() => setModalEquipo(false)} onSave={() => { setModalEquipo(false); notify("Equipo creado", "success"); load(); }} />}
      {modalReporte && (
        <ReporteFiltroModal cantidad={tareasSeleccionadas.length} onClose={() => setModalReporte(false)}
          onConfirm={async (modo, valorModo) => { await handleGenerarReporte(modo, valorModo); notify("Reporte descargado", "success"); }} />
      )}
    </div>
  );
}

//  PAGE: CORRECTIVOS 
function PageCorrectivos({ buque, notify }) {
  const [correctivos, setCorrectivos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, eq] = await Promise.all([api.getCorrectivos(buque.id), api.getEquipos(buque.id)]);
      setCorrectivos(c); setEquipos(eq);
    } finally { setLoading(false); }
  }, [buque.id]);

  useEffect(() => { load(); }, [load]);

  const STATUS_COLOR = { abierto: "b-red", en_proceso: "b-amber", resuelto: "b-green" };
  const STATUS_LABEL = { abierto: "Abierto", en_proceso: "En proceso", resuelto: "Resuelto" };
  const PRIO_COLOR = { critica: "b-red", alta: "b-amber", normal: "b-blue", baja: "b-gray" };
  const filtrados = correctivos.filter(c => !filtroStatus || c.status === filtroStatus);

  return (
    <div>
      <div className="filter-row">
        <select className="filter-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option><option value="en_proceso">En proceso</option><option value="resuelto">Resuelto</option>
        </select>
        {filtroStatus && <button className="btn btn-ghost btn-sm" onClick={() => setFiltroStatus("")}>✕ Limpiar</button>}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{filtrados.length} correctivos</span>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>+ Nuevo correctivo</button>
      </div>
      {loading ? <div className="loading"><span className="spin">◌</span> Cargando...</div> :
        filtrados.length === 0 ? <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>Sin correctivos</div> :
        filtrados.map(c => (
          <div key={c.id} className="alerta-row" style={{ borderLeft: `4px solid ${c.status === "abierto" ? "var(--danger)" : c.status === "en_proceso" ? "var(--warn)" : "var(--accent2)"}`, cursor: "pointer" }}
            onClick={() => setModal(c)}>
            <div className="flex-between mb8">
              <div className="flex-gap">
                <span className={`badge ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                <span className={`badge ${PRIO_COLOR[c.prioridad]}`}>{c.prioridad}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{fmtDate(c.fecha_deteccion)}</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--navy)", marginBottom: 4 }}>{c.titulo}</div>
            <div className="flex-gap">
              {c.mant_equipos && <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.mant_equipos.nombre}</span>}
              {c.descripcion && <><span style={{ color: "var(--muted2)" }}>·</span><span style={{ fontSize: 11, color: "var(--muted)" }}>{c.descripcion.slice(0, 80)}{c.descripcion.length > 80 ? "..." : ""}</span></>}
            </div>
          </div>
        ))
      }
      {modal !== null && <CorrectivoModal buqueId={buque.id} equipos={equipos} correctivo={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); notify("Correctivo guardado", "success"); load(); }} />}
    </div>
  );
}

//  PAGE: HISTORIAL 
function PageHistorial({ buque }) {
  const [ejecuciones, setEjecuciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState(""); const [hasta, setHasta] = useState("");

  useEffect(() => { api.getEjecuciones(buque.id).then(d => { setEjecuciones(d); setLoading(false); }); }, [buque.id]);

  const filtradas = ejecuciones.filter(e => {
    if (desde && e.fecha < desde) return false;
    if (hasta && e.fecha > hasta) return false;
    return true;
  });

  const dateIn = (val, set) => <input type="date" value={val} onChange={e => set(e.target.value)}
    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "5px 10px", fontSize: 11, fontFamily: "var(--sans)", outline: "none", color: "var(--text)" }} />;

  return (
    <div>
      <div className="filter-row">
        <div className="flex-gap">
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Desde</span>{dateIn(desde, setDesde)}
          <span style={{ fontSize: 11, color: "var(--muted)" }}>hasta</span>{dateIn(hasta, setHasta)}
        </div>
        {(desde || hasta) && <button className="btn btn-ghost btn-sm" onClick={() => { setDesde(""); setHasta(""); }}>✕ Limpiar</button>}
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{filtradas.length} ejecuciones</span>
      </div>
      {loading ? <div className="loading"><span className="spin">◌</span> Cargando...</div> :
        filtradas.length === 0 ? <div className="empty-state"><div style={{ fontSize: 28, marginBottom: 8 }}></div>Sin ejecuciones</div> :
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Tarea</th><th>Equipo</th><th>Horas</th><th>Realizado por</th><th>Atraso</th><th>Matriz</th></tr></thead>
              <tbody>
                {filtradas.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{fmtDate(e.fecha)}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{e.mant_tareas?.descripcion}</td>
                    <td style={{ fontSize: 11, color: "var(--muted)" }}>{e.mant_tareas?.mant_equipos?.nombre}</td>
                    <td className="text-mono" style={{ fontSize: 11, color: "var(--blue)" }}>{e.horas_equipo ? `${e.horas_equipo} hs` : "—"}</td>
                    <td style={{ fontSize: 11 }}>{e.realizado_por || "—"}</td>
                    <td>{e.fue_fuera_termino ? <span className="badge b-red">{e.dias_fuera_termino || "?"} días</span> : <span className="badge b-green">En término</span>}</td>
                    <td>{e.adjunto_riesgo_url ? <a href={e.adjunto_riesgo_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--blue)" }}>Ver</a> : <span style={{ fontSize: 11, color: "var(--muted2)" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  );
}

//  LOGIN PAGE — DS §8.7 / §9.1-C / §11.12 
function LoginPage() {
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [loadingL, setLoadingL] = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setLoadingL(true); setError("");
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (e) setError("Credenciales incorrectas. Verificá tu email y contraseña.");
    } catch {
      setError("Error de conexión. Verificá tu red e intentá nuevamente.");
    } finally {
      setLoadingL(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  // DS §9.1-C: fondo #0B1629, grid teal rgba(26,122,110,.06), gold #B8942A
  const loginCSS = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    .login-page{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 560px;background:#FFFFFF;font-family:'IBM Plex Sans',sans-serif;color:#0F1419;text-align:left}
    .login-bg-overlay,.login-bg-lines{display:none}
    .login-split{display:contents}
    .login-left{display:flex;flex-direction:column;justify-content:space-between;gap:48px;padding:56px 64px;background:#002247;border:0;text-align:left}
    .login-left-integra-wrap{margin:0}
    .login-left-integra-img{height:52px;width:auto;object-fit:contain;opacity:1;display:block}
    .login-left-divider{width:100%;height:1px;background:rgba(255,255,255,.14);margin:24px 0}
    .login-left-company{display:flex;align-items:center;gap:14px;margin:0}
    .login-left-company-logo{width:40px;height:40px;border-radius:4px;object-fit:contain;border:0;background:rgba(255,255,255,.14);padding:4px}
    .login-left-company-name{font:600 24px/1.25 'IBM Plex Sans',sans-serif;color:#fff;letter-spacing:0}
    .login-left-line{width:56px;height:3px;background:#F8BC05;margin:24px 0}
    .login-left-sub{font:400 15px/1.55 'IBM Plex Sans',sans-serif;color:rgba(255,255,255,.82);max-width:420px;font-style:normal}
    .login-right{width:auto;display:flex;align-items:center;justify-content:center;padding:56px 64px;background:#FFFFFF}
    .login-card{width:100%;max-width:420px;background:transparent;border:0;border-radius:0;padding:0;backdrop-filter:none;text-align:left}
    .login-card-eyebrow{font:500 11px/1.2 'IBM Plex Mono',monospace;letter-spacing:.08em;color:#4A5560;text-transform:uppercase;margin-bottom:12px}
    .login-card-title{font:600 24px/1.25 'IBM Plex Sans',sans-serif;color:#082F4E;margin-bottom:8px}
    .login-card-sub{font:400 15px/1.55 'IBM Plex Sans',sans-serif;color:#4A5560;letter-spacing:0;margin-bottom:28px;text-transform:none}
    .login-fg{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
    .login-fg label{font:500 11px/1.2 'IBM Plex Mono',monospace;color:#4A5560;letter-spacing:.08em;text-transform:uppercase}
    .login-fg input{border:1px solid #C9D0D6;border-radius:4px;height:40px;padding:0 12px;font:400 14px/1.2 'IBM Plex Sans',sans-serif;color:#0F1419;background:#FFFFFF;outline:none;transition:border-color 120ms cubic-bezier(.2,0,.38,.9)}
    .login-fg input::placeholder{color:#7A8792}
    .login-fg input:focus{border-width:2px;border-color:#002247;padding:0 11px}
    .login-btn{width:100%;height:44px;padding:0 16px;margin-top:24px;background:#F8BC05;color:#002247;border:none;border-radius:4px;font:600 15px/1.2 'IBM Plex Sans',sans-serif;cursor:pointer;transition:background-color 120ms cubic-bezier(.2,0,.38,.9);letter-spacing:0}
    .login-btn:hover{background:#DCA704}
    .login-btn:disabled{background:#E4E8EC;color:#7A8792;cursor:not-allowed}
    .login-error{background:#FFFFFF;color:#0F1419;border:1px solid #E4E8EC;border-left:3px solid #B3261E;border-radius:4px;padding:12px 16px;font:400 13px/1.45 'IBM Plex Sans',sans-serif;margin-bottom:16px}
    .login-footer{text-align:left;font:500 11px/1.2 'IBM Plex Mono',monospace;color:#4A5560;margin-top:32px;letter-spacing:.06em}
    .login-back{text-align:left;margin-top:12px;font:500 14px/1.2 'IBM Plex Sans',sans-serif;color:#002247;cursor:pointer}
    .login-back:hover{text-decoration:underline}
    @media(max-width:900px){
      .login-page{grid-template-columns:1fr}
      .login-left{padding:40px 24px;gap:32px}
      .login-left-integra-img{height:40px}
      .login-left-sub{max-width:100%}
      .login-right{padding:40px 24px}
    }
  
  `;

  return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page">
        <div className="login-bg-lines" />
        <div className="login-bg-overlay" />
        <div className="login-split">

          {/*  Panel izquierdo: marca INTEGRA  */}
          <div className="login-left">
            <div className="login-left-integra-wrap">
              <img src="/integra-logo-white-noclaim.svg" alt="INTEGRA" className="login-left-integra-img" />
            </div>
            <div className="login-left-divider" />
            <div className="login-left-company">
              <img src="/PL.png" alt="PL Offshore" className="login-left-company-logo" />
              <div className="login-left-company-name">PL Offshore | Mantenimiento</div>
            </div>
            <div className="login-left-line" />
            <div className="login-left-sub">We Find the Way, or We Make One.</div>
          </div>

          {/*  Panel derecho: formulario  */}
          <div className="login-right">
            <div className="login-card">
              <div className="login-card-eyebrow">PL Offshore | Mantenimiento</div>
              <div className="login-card-title">Acceso al portal</div>
              <div className="login-card-sub">Solo personal autorizado</div>
              {error && <div className="login-error">{error}</div>}
              <div className="login-fg">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="usuario@paranalogistica.com.ar" autoFocus />
              </div>
              <div className="login-fg">
                <label>Contraseña</label>
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" />
              </div>
              <button className="login-btn" onClick={handleLogin} disabled={loadingL || !email || !pass}>
                {loadingL ? "Ingresando..." : "Ingresar →"}
              </button>
              <div className="login-footer">PL Offshore · Mantenimiento · Confidencial</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

//  ROOT APP
const ERP_URL = "https://integra.ploffshore.com/";

// Cuentas de buque: solo ven su propio buque. Cualquier otro usuario
// (gerencia, etc.) no listado acá ve todos los buques sin restricción.
const ACCESO_POR_BUQUE = {
  "atlanticdama@ploffshore.com": "Atlantic Dama",
  "golondrinademar@ploffshore.com": "Golondrina de Mar",
};

function MantenimientoApp({ email }) {
  const [buques, setBuques] = useState([]);
  const [buqueSeleccionado, setBuqueSeleccionado] = useState(null);
  const [page, setPage] = useState("plan");
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  const cerrarSesion = () => supabase.auth.signOut();

  const notify = useCallback((text, type = "info") => {
    setNotif({ text, type });
    setTimeout(() => setNotif(null), 4000);
  }, []);

  // Las cuentas de buque (ACCESO_POR_BUQUE) son tripulación; cualquier otra cuenta
  // (gerencia) tiene permiso para cargar la hora inicial de un equipo sin datos previos.
  const esGerente = !ACCESO_POR_BUQUE[email?.toLowerCase()];
  const nombreUsuario = esGerente ? NOMBRE_GERENCIA : NOMBRE_TRIPULACION;
  const inicialesUsuario = esGerente ? "GT" : "JM";

  useEffect(() => {
    api.getBuques().then(data => {
      const buqueRestringido = ACCESO_POR_BUQUE[email?.toLowerCase()];
      const visibles = buqueRestringido ? data.filter(b => b.nombre === buqueRestringido) : data;
      setBuques(visibles);
      if (visibles.length) setBuqueSeleccionado(visibles[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [email]);

  const [navOpen, setNavOpen] = useState(true);

  const Ico = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
  );
  const ICONS = {
    ship:  <><path d="M4 17l1.6-5.4h12.8L20 17a10 10 0 0 1-16 0z" /><path d="M12 11.6V5.5M8.5 5.5h7" /></>,
    grid:  <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>,
    list:  <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></>,
    warn:  <><path d="M12 4.5l8.5 15H3.5z" /><path d="M12 10v4M12 17h.01" /></>,
    file:  <><path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6z" /><path d="M14 3v4.6h4.6" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9.5 4v16" /></>,
    bell:  <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    help:  <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.1 1-1.1 1.7v.3" /><path d="M12 17.5h.01" /></>,
    arrowLeft: <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
    swap:  <><path d="M17 3l4 4-4 4" /><path d="M3 7h18" /><path d="M7 21l-4-4 4-4" /><path d="M21 17H3" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  };

  const SECCIONES = {
    dashboard:   { titulo: buqueSeleccionado ? buqueSeleccionado.nombre : "Dashboard", sub: "Estado del plan de mantenimiento, horas de equipo y tareas próximas a vencer." },
    horas:       { titulo: "Carga de horas",        sub: "Horas de funcionamiento por equipo. De acá salen los vencimientos del plan." },
    plan:        { titulo: "Plan de mantenimiento", sub: "Tareas preventivas por equipo, con periodicidad y última ejecución." },
    correctivos: { titulo: "Correctivos",           sub: "Intervenciones no programadas, con criticidad y estado de resolución." },
    historial:   { titulo: "Historial",             sub: "Todas las intervenciones ejecutadas, con responsable y repuestos usados." },
    kpis:        { titulo: "KPIs",                  sub: "Cumplimiento del plan, tiempo de resolución y disponibilidad por equipo." },
  };

  const VISTAS = [
    { id: "plan",        icon: "list",  label: "Plan completo" },
    { id: "horas",       icon: "clock", label: "Carga de horas" },
    { id: "dashboard",   icon: "grid",  label: "Dashboard" },
    { id: "correctivos", icon: "warn",  label: "Correctivos" },
    { id: "historial",   icon: "file",  label: "Historial" },
    { id: "kpis",        icon: "chart", label: "KPIs" },
  ];

  const seccion = SECCIONES[page] || { titulo: page, sub: "" };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loading" style={{ minHeight: "100vh" }}>Cargando…</div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>

      <header className="appbar">
        <img src="/integra-isotipo-white.svg" alt="INTEGRA" className="appbar-iso" />
        <span className="appbar-div" />
        <span className="appbar-instance">PL Offshore</span>
        <input className="appbar-search" type="search" disabled placeholder="Buscar en todo INTEGRA" aria-label="Buscar" />
        <div className="appbar-tools">
          <span style={{ color: "rgba(255,255,255,.86)", display: "block" }}><Ico d={ICONS.bell} /></span>
          <span style={{ color: "rgba(255,255,255,.86)", display: "block" }}><Ico d={ICONS.help} /></span>
          <span className="appbar-div" />
          <span className="appbar-avatar">{inicialesUsuario}</span>
          <span className="appbar-user">{nombreUsuario}</span>
        </div>
      </header>

      <div className={`shell ${navOpen ? "" : "is-collapsed"}`}>
        <nav className="sidebar">
          <div className="sidebar-header" onClick={() => setPage("plan")} style={{ cursor: "pointer" }}>
            <img src="/PL.png" alt="PL Offshore" className="sidebar-logo-img" onError={e => { e.currentTarget.style.display = "none"; }} />
            {navOpen && (
              <div>
                <div className="sidebar-logo-main">Mantenimiento</div>
                <div className="sidebar-logo-sub">PL Offshore</div>
              </div>
            )}
          </div>

          <div className="sidebar-nav">
            <div style={{ marginBottom: 8 }}>
              {navOpen && <div className="nav-section">Buques</div>}
              {buques.map(b => (
                <button
                  key={b.id}
                  className={`ni ${buqueSeleccionado?.id === b.id ? "active" : ""}`}
                  onClick={() => { setBuqueSeleccionado(b); setPage("dashboard"); }}
                  title={b.nombre}
                >
                  <span className="ni-ico"><Ico d={ICONS.ship} /></span>
                  {navOpen && <span className="ni-label">{b.nombre}</span>}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 8 }}>
              {navOpen && <div className="nav-section">Vistas</div>}
              {VISTAS.map(v => (
                <button key={v.id} className={`ni ${page === v.id ? "active" : ""}`} onClick={() => setPage(v.id)} title={v.label}>
                  <span className="ni-ico"><Ico d={ICONS[v.icon]} /></span>
                  {navOpen && <span className="ni-label">{v.label}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-foot user-menu-wrap">
            {menuUsuarioAbierto && navOpen && (
              <div className="user-menu-popup">
                <button className="user-menu-item" onClick={() => { window.location.href = ERP_URL; }}>
                  <Ico d={ICONS.arrowLeft} size={16} /> Volver al ERP
                </button>
                <button className="user-menu-item" onClick={cerrarSesion}>
                  <Ico d={ICONS.swap} size={16} /> Cambiar usuario
                </button>
                <button className="user-menu-item" onClick={cerrarSesion}>
                  <Ico d={ICONS.logout} size={16} /> Cerrar sesión
                </button>
                <div className="user-menu-meta">
                  <div>{email}</div>
                  <div>MANTENIMIENTO v1.1</div>
                </div>
              </div>
            )}
            {navOpen && (
              <button className="sidebar-foot-btn" onClick={() => setMenuUsuarioAbierto(v => !v)}>
                <span style={{ display: "block", color: "var(--muted2)" }}><Ico d={ICONS.help} size={16} /></span>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
              </button>
            )}
            <button className="sidebar-foot-btn" onClick={() => setNavOpen(v => !v)}>
              <span style={{ display: "block", color: "var(--muted2)" }}><Ico d={ICONS.panel} size={16} /></span>
              {navOpen && <span style={{ flex: 1, textAlign: "left" }}>Colapsar menú</span>}
            </button>
          </div>
        </nav>

        <div className="main">
          <div className="pagehead">
            <div className="crumb">
              <span>Mantenimiento</span>
              <span>/</span>
              <span className="crumb-current">{seccion.titulo}</span>
            </div>
            <div className="pagehead-row">
              <div>
                <h1>{seccion.titulo}</h1>
                {seccion.sub && <p>{seccion.sub}</p>}
              </div>
            </div>
          </div>

          <div className="content">
            {!buqueSeleccionado
              ? <div className="empty-state">Seleccioná un buque en el menú para ver su plan de mantenimiento.</div>
              : <>
                  {page === "dashboard" && <PageDashboard buque={buqueSeleccionado} notify={notify} />}
                  {page === "horas" && <PageHoras buque={buqueSeleccionado} notify={notify} esGerente={esGerente} nombreUsuario={nombreUsuario} />}
                  {page === "plan" && <PagePlan buque={buqueSeleccionado} notify={notify} esGerente={esGerente} nombreUsuario={nombreUsuario} />}
                  {page === "correctivos" && <PageCorrectivos buque={buqueSeleccionado} notify={notify} />}
                  {page === "historial" && <PageHistorial buque={buqueSeleccionado} />}
                  {page === "kpis" && <PageKPIs buque={buqueSeleccionado} />}
                </>
            }
          </div>
        </div>
      </div>

      <Notif msg={notif} onClose={() => setNotif(null)} />

      <nav className="mobile-nav">
        {VISTAS.slice(0, 5).map(v => (
          <div key={v.id} className={`mobile-nav-item ${page === v.id ? "active" : ""}`} onClick={() => setPage(v.id)}>
            <span className="mobile-nav-icon"><Ico d={ICONS[v.icon]} size={18} /></span>
            <span className="mobile-nav-label">{v.label.split(" ")[0]}</span>
          </div>
        ))}
      </nav>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#213363" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase" }}>Cargando...</div>
    </div>
  );

  if (!session) return <LoginPage />;
  return <MantenimientoApp email={session.user.email} />;
}
