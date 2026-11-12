from typing import Literal

from pydantic import BaseModel, Field

Conf = Literal["low", "medium", "high"]


class RiskDriver(BaseModel):
    factor: str
    evidence_refs: list[str] = Field(default_factory=list)
    interpretation: str
    confidence: Conf


class Hypothesis(BaseModel):
    hypothesis: str
    supporting_evidence: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    confidence: Conf
    validation_needed: bool = True


class Action(BaseModel):
    action: str
    target_group: str
    suggested_kpis: list[str] = Field(default_factory=list)
    time_horizon: str
    evidence_refs: list[str] = Field(default_factory=list)


class LLMOutput(BaseModel):
    summary: str
    risk_drivers: list[RiskDriver] = Field(default_factory=list)
    root_cause_hypotheses: list[Hypothesis] = Field(default_factory=list)
    recommended_actions: list[Action] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class AssistantOutput(BaseModel):
    answer: str
    answerable: bool = True  # false bila data NCRI tidak cukup untuk menjawab
    evidence_refs: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
