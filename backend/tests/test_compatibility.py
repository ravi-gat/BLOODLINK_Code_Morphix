"""
Tests for blood group compatibility logic.
"""
import pytest
from app.utils.blood_compat import is_compatible, get_compatible_donors, compatibility_score
from app.models.enums import BloodGroup


def test_o_neg_is_universal_donor():
    """O- can donate to all blood groups."""
    for recipient in BloodGroup:
        assert is_compatible(BloodGroup.O_NEG, recipient), f"O- should be compatible with {recipient}"


def test_ab_pos_is_universal_recipient():
    """AB+ can receive from all blood groups."""
    for donor in BloodGroup:
        assert is_compatible(donor, BloodGroup.AB_POS), f"{donor} should be compatible with AB+"


def test_o_pos_cannot_donate_to_negatives():
    """O+ cannot donate to O-, A-, B-, AB-."""
    negative_recipients = [BloodGroup.O_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG]
    for recipient in negative_recipients:
        assert not is_compatible(BloodGroup.O_POS, recipient), f"O+ should not be compatible with {recipient}"


def test_same_type_always_compatible():
    """Same blood type is always compatible."""
    for bg in BloodGroup:
        assert is_compatible(bg, bg), f"{bg} should be compatible with itself"


def test_ab_neg_cannot_donate_to_o():
    """AB- cannot donate to O+ or O-."""
    assert not is_compatible(BloodGroup.AB_NEG, BloodGroup.O_POS)
    assert not is_compatible(BloodGroup.AB_NEG, BloodGroup.O_NEG)


def test_compatibility_score_exact_match():
    """Exact type match returns 1.0."""
    assert compatibility_score(BloodGroup.A_POS, BloodGroup.A_POS) == 1.0


def test_compatibility_score_universal_donor():
    """O- donating to non-O- returns 0.8."""
    assert compatibility_score(BloodGroup.O_NEG, BloodGroup.A_POS) == 0.8


def test_compatibility_score_incompatible_returns_zero():
    """Incompatible pair returns 0.0."""
    assert compatibility_score(BloodGroup.AB_NEG, BloodGroup.O_POS) == 0.0


def test_get_compatible_donors_o_pos():
    """O+ recipient can receive from O+ and O-."""
    compatible = get_compatible_donors(BloodGroup.O_POS)
    assert BloodGroup.O_NEG in compatible
    assert BloodGroup.O_POS in compatible
    assert BloodGroup.A_POS not in compatible


def test_all_blood_groups_have_compatible_donors():
    """Every blood group has at least one compatible donor."""
    for bg in BloodGroup:
        compatible = get_compatible_donors(bg)
        assert len(compatible) >= 1, f"No compatible donors found for {bg}"
