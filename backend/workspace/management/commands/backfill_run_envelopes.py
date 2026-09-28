import json

from django.conf import settings
from django.core.management.base import BaseCommand

from workspace.engine_worker import _sha256, compact_envelope, run_output_path
from workspace.models import EngineAction


class Command(BaseCommand):
    help = (
        "Re-capture stored run envelopes from outputs/ when the file on disk is still "
        "the one the run wrote (same SHA-256), so older runs keep their proof fields."
    )

    def handle(self, *args, **options):
        updated = skipped = 0
        for action in EngineAction.objects.filter(
            kind=EngineAction.Kind.RUN, status=EngineAction.Status.SUCCEEDED
        ):
            relative = run_output_path(action.arguments_json or {})
            recorded = (action.result_hashes_json or {}).get(relative, {}).get("sha256")
            path = settings.ENGINE_ROOT / relative
            if not recorded or not path.is_file() or _sha256(path) != recorded:
                skipped += 1
                continue
            action.result_json = compact_envelope(json.loads(path.read_text(encoding="utf-8")))
            action.save(update_fields=("result_json",))
            updated += 1
        self.stdout.write(f"re-captured {updated} run envelope(s); {skipped} left as stored "
                          "(file replaced by a newer run, or no recorded hash)")
