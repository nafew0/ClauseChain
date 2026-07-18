from rest_framework import serializers

from .models import FindingDecision, RecallDecision, ReviewItem, Zone3Decision


class ConcurrencySerializer(serializers.Serializer):
    expected_latest_decision_id = serializers.UUIDField(required=True, allow_null=True)


class FindingDecisionWriteSerializer(ConcurrencySerializer):
    finding_key = serializers.RegexField(r"^[0-9a-f]{64}$")
    queue = serializers.ChoiceField(
        choices=(ReviewItem.Queue.NEW, ReviewItem.Queue.KNOWN, ReviewItem.Queue.ABSENCE)
    )
    review_stage = serializers.ChoiceField(choices=FindingDecision.Stage.choices)
    decision = serializers.ChoiceField(choices=FindingDecision.Verdict.choices)
    citation_checked = serializers.BooleanField(default=False)
    mapping_checked = serializers.BooleanField(default=False)
    status_checked = serializers.BooleanField(default=False)
    note = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        stage = attrs["review_stage"]
        required_check = {
            FindingDecision.Stage.CITATION: "citation_checked",
            FindingDecision.Stage.MAPPING: "mapping_checked",
            FindingDecision.Stage.STATUS: "status_checked",
        }[stage]
        if attrs["decision"] == FindingDecision.Verdict.APPROVED and not attrs[required_check]:
            raise serializers.ValidationError(
                {required_check: f"{required_check} is required for an approved {stage} review."}
            )
        return attrs


class RecallDecisionWriteSerializer(ConcurrencySerializer):
    recall_key = serializers.RegexField(r"^[0-9a-f]{64}$")
    verdict = serializers.ChoiceField(choices=RecallDecision.Verdict.choices)
    reasoning = serializers.CharField(required=False, allow_blank=True, default="")
    official_source_url = serializers.URLField(required=False, allow_blank=True, default="")


class Zone3DecisionWriteSerializer(ConcurrencySerializer):
    score_key = serializers.RegexField(r"^[0-9a-f]{64}$")
    verdict = serializers.ChoiceField(choices=Zone3Decision.Verdict.choices)
    score = serializers.DecimalField(max_digits=2, decimal_places=1)
    reasoning = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if attrs["score"] not in (0, 0.5, 1):
            raise serializers.ValidationError({"score": "Score must be 0, 0.5, or 1."})
        if attrs["verdict"] == Zone3Decision.Verdict.OVERRIDDEN and not attrs["reasoning"].strip():
            raise serializers.ValidationError({"reasoning": "An override requires reasoning."})
        return attrs


class CorrectionRequestWriteSerializer(serializers.Serializer):
    finding_key = serializers.RegexField(r"^[0-9a-f]{64}$")
    queue = serializers.ChoiceField(
        choices=(ReviewItem.Queue.NEW, ReviewItem.Queue.KNOWN, ReviewItem.Queue.ABSENCE)
    )
    explanation = serializers.CharField(min_length=3)
    expected_latest_correction_id = serializers.UUIDField(required=True, allow_null=True)
