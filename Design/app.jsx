// ===========================================================
// ClauseChain — App router (Pages 1–10)
// ===========================================================
/* global React, ReactDOM, JURISDICTIONS, DOCUMENTS,
   Sidebar, TopBar, ToastHost, CommandPalette,
   DashboardPage, JurisdictionPage, DocumentWorkspacePage, MatrixPage, LedgerPage,
   CrawlConsolePage, HarvestReviewPage, ExtractionWorkspacePage, MappingRunPage, SourceTracePage,
   AddJurisdictionModal, AddDocumentModal, CrawlStatusDrawer,
   CitationDetailDrawer, ConflictModal, EditClassificationModal, RejectModal,
   CellDrilldownModal, ExportModal, LedgerEntryModal, ReverifyModal */

const { useState: useAppState, useEffect: useAppEffect } = React;

function App() {
  const [route, setRoute] = useAppState({ page: "dashboard" });
  const [cmdOpen, setCmdOpen] = useAppState(false);

  // Modal/overlay state
  const [showAddJ,     setShowAddJ]     = useAppState(false);
  const [showAddD,     setShowAddD]     = useAppState(false);
  const [showCrawl,    setShowCrawl]    = useAppState(false);
  const [showCitation, setShowCitation] = useAppState(false);
  const [showConflict, setShowConflict] = useAppState(false);
  const [showEdit,     setShowEdit]     = useAppState(false);
  const [showReject,   setShowReject]   = useAppState(false);
  const [showExport,   setShowExport]   = useAppState(false);
  const [showReverify, setShowReverify] = useAppState(false);
  const [drilldown,    setDrilldown]    = useAppState(null);
  const [ledgerEntry,  setLedgerEntry]  = useAppState(null);

  useAppEffect(() => {
    window.openAddJurisdiction = () => setShowAddJ(true);
    window.openExport          = () => setShowExport(true);
  }, []);

  // ⌘K
  useAppEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const navigate = (r) => setRoute(r);

  // Breadcrumbs
  const crumbs = (() => {
    const c = [{ label: "Dashboard", nav: { page: "dashboard" } }];
    const p = route.page;
    if (p === "matrix")   c.push({ label: "RDTII Matrix" });
    else if (p === "ledger")   c.push({ label: "Pipeline & Ledger" });
    else if (p === "crawl")    c.push({ label: "Pipeline" }, { label: "Crawl Console" });
    else if (p === "harvest")  c.push({ label: "Pipeline" }, { label: "Harvest Review" });
    else if (p === "extract")  c.push({ label: "Pipeline" }, { label: "Extraction" });
    else if (p === "map")      c.push({ label: "Pipeline" }, { label: "Mapping Run" });
    else if (p === "trace")    c.push({ label: "BD-DSA-2018", nav: { page: "doc", country: "BD", doc: "BD-DSA-2018" } }, { label: "Source Trace" });
    else if (p === "jurisdiction") {
      const j = JURISDICTIONS.find(x => x.code === route.country);
      c.push({ label: j ? j.name : route.country });
    } else if (p === "doc") {
      const j = JURISDICTIONS.find(x => x.code === route.country);
      const d = (DOCUMENTS[route.country] || []).find(x => x.id === route.doc);
      c.push({ label: j ? j.name : route.country, nav: { page: "jurisdiction", country: route.country } });
      c.push({ label: d ? d.title : route.doc });
      if (route.doc === "BD-DSA-2018") c.push({ label: "§26(1)" });
    }
    return c;
  })();

  // Pages that use the full-bleed pipeline layout (no extra padding wrapper)
  const isPipelinePage = ["crawl","harvest","extract","map"].includes(route.page);

  return (
    <div className="app-shell">
      <Sidebar current={route} onNavigate={navigate} jurisdictions={JURISDICTIONS} />
      <div className="main">
        <TopBar crumbs={crumbs} onNavigate={navigate} onOpenSearch={() => setCmdOpen(true)} />

        {route.page === "dashboard" && (
          <DashboardPage onNavigate={navigate} onOpenAddJurisdiction={() => setShowAddJ(true)} />
        )}
        {route.page === "jurisdiction" && (
          <JurisdictionPage country={route.country} onNavigate={navigate}
                            onOpenAddDocument={() => setShowAddD(true)}
                            onOpenCrawlDrawer={() => setShowCrawl(true)} />
        )}
        {route.page === "doc" && (
          <DocumentWorkspacePage onNavigate={navigate}
                                 onOpenCitationDetail={() => setShowCitation(true)}
                                 onOpenConflict={() => setShowConflict(true)}
                                 onOpenEdit={() => setShowEdit(true)}
                                 onOpenReject={() => setShowReject(true)} />
        )}
        {route.page === "matrix" && (
          <MatrixPage onNavigate={navigate} onOpenExport={() => setShowExport(true)}
                      onOpenCellDrilldown={(d) => setDrilldown(d)} />
        )}
        {route.page === "ledger" && (
          <LedgerPage initialTab={route.tab}
                      onOpenLedgerEntry={(e) => setLedgerEntry(e)}
                      onOpenReverify={() => setShowReverify(true)} />
        )}

        {/* Pipeline pages (Pages 6–10) */}
        {route.page === "crawl" && (
          <CrawlConsolePage onNavigate={navigate} />
        )}
        {route.page === "harvest" && (
          <HarvestReviewPage onNavigate={navigate} />
        )}
        {route.page === "extract" && (
          <ExtractionWorkspacePage tab={route.tab} onNavigate={navigate} />
        )}
        {route.page === "map" && (
          <MappingRunPage onNavigate={navigate} />
        )}
        {route.page === "trace" && (
          <SourceTracePage docId={route.docId} onNavigate={navigate} />
        )}
      </div>

      {/* Global overlays */}
      <ToastHost />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigate} />

      <AddJurisdictionModal    open={showAddJ}       onClose={() => setShowAddJ(false)} />
      <AddDocumentModal        open={showAddD}       onClose={() => setShowAddD(false)} country={route.country} />
      <CrawlStatusDrawer       open={showCrawl}      onClose={() => setShowCrawl(false)} />
      <CitationDetailDrawer    open={showCitation}   onClose={() => setShowCitation(false)} />
      <ConflictModal           open={showConflict}   onClose={() => setShowConflict(false)} />
      <EditClassificationModal open={showEdit}       onClose={() => setShowEdit(false)} />
      <RejectModal             open={showReject}     onClose={() => setShowReject(false)} />
      <ExportModal             open={showExport}     onClose={() => setShowExport(false)} />
      <CellDrilldownModal      open={!!drilldown}    onClose={() => setDrilldown(null)}   data={drilldown} onNavigate={navigate} />
      <LedgerEntryModal        open={!!ledgerEntry}  onClose={() => setLedgerEntry(null)} entry={ledgerEntry} onNavigate={navigate} />
      <ReverifyModal           open={showReverify}   onClose={() => setShowReverify(false)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
