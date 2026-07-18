ROLE_GROUPS = {
    "citation": "citation_reviewer",
    "mapping": "mapping_reviewer",
    "status": "status_reviewer",
    "recall": "mapping_reviewer",
    "zone3": "mapping_reviewer",
    "admin": "admin",
}


def has_review_role(user, role):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    group = ROLE_GROUPS.get(role, role)
    return user.groups.filter(name__in=(group, "admin")).exists()


def reviewer_identity(user):
    return user.full_name, str(user.pk)
