from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AdvisoryType(str, Enum):
    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTENANCE = "maintenance"
    COMPLIANCE = "compliance"
    BEST_PRACTICE = "best_practice"


class ConditionOperator(str, Enum):
    EQUALS = "eq"
    NOT_EQUALS = "ne"
    GREATER_THAN = "gt"
    GREATER_THAN_OR_EQUAL = "gte"
    LESS_THAN = "lt"
    LESS_THAN_OR_EQUAL = "lte"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"
    REGEX = "regex"


class Condition(BaseModel):
    field: str
    operator: ConditionOperator
    value: Any
    description: Optional[str] = None


class Rule(BaseModel):
    id: str
    name: str
    description: str
    advisory_type: AdvisoryType
    severity: SeverityLevel
    conditions: List[Condition]
    message: str
    recommendation: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Advisory(BaseModel):
    id: str
    rule_id: str
    title: str
    description: str
    severity: SeverityLevel
    advisory_type: AdvisoryType
    message: str
    recommendation: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)


class EvaluationContext(BaseModel):
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)
    source: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvaluationResult(BaseModel):
    advisories: List[Advisory]
    rules_evaluated: int
    rules_matched: int
    evaluation_time_ms: float
    context: EvaluationContext
