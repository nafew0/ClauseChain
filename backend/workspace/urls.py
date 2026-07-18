from django.urls import path

from .views import (
    CorrectionRequestView,
    EvidenceDetailView,
    EvidenceListView,
    DecisionHistoryView,
    FindingBulkDecisionView,
    FindingDecisionView,
    RecallDecisionView,
    ReviewQueueView,
    RunsView,
    SummaryView,
    Zone3DecisionView,
)


app_name = "workspace"

urlpatterns = [
    path("summary/", SummaryView.as_view(), name="summary"),
    path("review/<str:queue>/", ReviewQueueView.as_view(), name="review_queue"),
    path("evidence/", EvidenceListView.as_view(), name="evidence"),
    path(
        "evidence/<str:finding_key>/",
        EvidenceDetailView.as_view(),
        name="evidence_detail",
    ),
    path("runs/", RunsView.as_view(), name="runs"),
    path("decisions/findings/", FindingDecisionView.as_view(), name="finding_decision"),
    path(
        "decisions/findings/bulk/",
        FindingBulkDecisionView.as_view(),
        name="finding_bulk_decision",
    ),
    path(
        "decisions/<str:domain>/<str:key>/history/",
        DecisionHistoryView.as_view(),
        name="decision_history",
    ),
    path("decisions/recall/", RecallDecisionView.as_view(), name="recall_decision"),
    path("decisions/zone3/", Zone3DecisionView.as_view(), name="zone3_decision"),
    path("corrections/", CorrectionRequestView.as_view(), name="correction_request"),
]
