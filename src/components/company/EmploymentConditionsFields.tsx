"use client";

import type { ReactNode } from "react";
import { Briefcase, CalendarDays, Clock, LogOut, MapPin, Wallet } from "lucide-react";
import { ProfileSection } from "@/components/engineer/profile/ProfileSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTRACT_PERIOD_TYPE_OPTIONS,
  EMPLOYMENT_FIELD_LABELS,
  EMPLOYMENT_FORM_NOTICE,
  EMPLOYMENT_OTHER_CONDITIONS_META,
  EMPLOYMENT_SECTION_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  WAGE_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  type EmploymentConditions,
  type EmploymentFieldKey,
  type YesNo,
} from "@/constants/employment";

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface FieldProps {
  idPrefix: string;
  errors: Record<string, string>;
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function FieldWrapper({
  idPrefix,
  fieldKey,
  errors,
  children,
}: FieldProps & { fieldKey: EmploymentFieldKey; children: ReactNode }) {
  const meta = EMPLOYMENT_FIELD_LABELS[fieldKey];
  const id = `${idPrefix}-emp-${fieldKey}`;
  const error = errors[fieldKey];
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {meta.label}
        {meta.required && <RequiredMark />}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends FieldProps {
  fieldKey: EmploymentFieldKey;
  value: string;
  onValueChange: (value: string) => void;
  multiline?: boolean;
}

function TextField({ idPrefix, fieldKey, value, onValueChange, errors, multiline }: TextFieldProps) {
  const meta = EMPLOYMENT_FIELD_LABELS[fieldKey];
  const id = `${idPrefix}-emp-${fieldKey}`;
  const error = errors[fieldKey];
  return (
    <FieldWrapper idPrefix={idPrefix} fieldKey={fieldKey} errors={errors}>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          placeholder={meta.placeholder}
          onChange={(event) => onValueChange(event.target.value)}
          required={meta.required}
          aria-required={meta.required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          rows={3}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          placeholder={meta.placeholder}
          onChange={(event) => onValueChange(event.target.value)}
          required={meta.required}
          aria-required={meta.required || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-9"
        />
      )}
    </FieldWrapper>
  );
}

interface SelectFieldProps extends FieldProps {
  fieldKey: EmploymentFieldKey;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  includeBlank?: boolean;
}

function SelectField({
  idPrefix,
  fieldKey,
  value,
  onValueChange,
  options,
  includeBlank,
  errors,
}: SelectFieldProps) {
  const meta = EMPLOYMENT_FIELD_LABELS[fieldKey];
  const id = `${idPrefix}-emp-${fieldKey}`;
  const error = errors[fieldKey];
  return (
    <FieldWrapper idPrefix={idPrefix} fieldKey={fieldKey} errors={errors}>
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        required={meta.required}
        aria-required={meta.required || undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${SELECT_CLASS} ${error ? "border-destructive ring-3 ring-destructive/20" : ""}`}
      >
        {includeBlank && <option value="">選択してください</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

function YesNoField(props: FieldProps & {
  fieldKey: EmploymentFieldKey;
  value: YesNo;
  onValueChange: (value: YesNo) => void;
}) {
  return (
    <SelectField
      {...props}
      options={YES_NO_OPTIONS}
      includeBlank
      onValueChange={(value) => props.onValueChange(value as YesNo)}
    />
  );
}

interface EmploymentConditionsFieldsProps {
  conditions: EmploymentConditions;
  onChange: (patch: Partial<EmploymentConditions>) => void;
  idPrefix: string;
  errors: Record<string, string>;
}

export function EmploymentConditionsFields({
  conditions,
  onChange,
  idPrefix,
  errors,
}: EmploymentConditionsFieldsProps) {
  const fieldProps: FieldProps = { idPrefix, errors };
  const isFixedTerm = conditions.contractPeriodType === "期間の定めあり";
  const hasRenewalLimit = conditions.renewal.hasRenewalLimit === "あり";
  const hasFixedOvertimePay = conditions.hasFixedOvertimePay === "あり";

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {EMPLOYMENT_FORM_NOTICE}
      </p>

      <ProfileSection title={EMPLOYMENT_SECTION_LABELS.employmentContract} icon={Briefcase}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              {...fieldProps}
              fieldKey="dutiesScopeOfChange"
              value={conditions.dutiesScopeOfChange}
              onValueChange={(value) => onChange({ dutiesScopeOfChange: value })}
            />
          </div>
          <SelectField
            {...fieldProps}
            fieldKey="employmentType"
            value={conditions.employmentType}
            onValueChange={(value) => onChange({ employmentType: value })}
            options={EMPLOYMENT_TYPE_OPTIONS}
          />
          <SelectField
            {...fieldProps}
            fieldKey="contractPeriodType"
            value={conditions.contractPeriodType}
            onValueChange={(value) =>
              onChange({ contractPeriodType: value as EmploymentConditions["contractPeriodType"] })
            }
            options={CONTRACT_PERIOD_TYPE_OPTIONS}
            includeBlank
          />
          <TextField
            {...fieldProps}
            fieldKey="probationPeriod"
            value={conditions.probationPeriod}
            onValueChange={(value) => onChange({ probationPeriod: value })}
          />

          {isFixedTerm && (
            <>
              <TextField
                {...fieldProps}
                fieldKey="contractPeriod"
                value={conditions.contractPeriod}
                onValueChange={(value) => onChange({ contractPeriod: value })}
              />
              <YesNoField
                {...fieldProps}
                fieldKey="hasRenewal"
                value={conditions.renewal.hasRenewal}
                onValueChange={(value) =>
                  onChange({ renewal: { ...conditions.renewal, hasRenewal: value } })
                }
              />
              {conditions.renewal.hasRenewal === "あり" && (
                <div className="sm:col-span-2">
                  <TextField
                    {...fieldProps}
                    fieldKey="renewalCriteria"
                    value={conditions.renewal.renewalCriteria}
                    onValueChange={(value) =>
                      onChange({ renewal: { ...conditions.renewal, renewalCriteria: value } })
                    }
                    multiline
                  />
                </div>
              )}
              <YesNoField
                {...fieldProps}
                fieldKey="hasRenewalLimit"
                value={conditions.renewal.hasRenewalLimit}
                onValueChange={(value) =>
                  onChange({ renewal: { ...conditions.renewal, hasRenewalLimit: value } })
                }
              />
              {hasRenewalLimit && (
                <>
                  <TextField
                    {...fieldProps}
                    fieldKey="renewalLimitCount"
                    value={conditions.renewal.renewalLimitCount}
                    onValueChange={(value) =>
                      onChange({ renewal: { ...conditions.renewal, renewalLimitCount: value } })
                    }
                  />
                  <TextField
                    {...fieldProps}
                    fieldKey="totalContractPeriodLimit"
                    value={conditions.renewal.totalContractPeriodLimit}
                    onValueChange={(value) =>
                      onChange({
                        renewal: { ...conditions.renewal, totalContractPeriodLimit: value },
                      })
                    }
                  />
                </>
              )}
            </>
          )}
        </div>
      </ProfileSection>

      <ProfileSection title={EMPLOYMENT_SECTION_LABELS.workplace} icon={MapPin}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            {...fieldProps}
            fieldKey="workplace"
            value={conditions.workplace}
            onValueChange={(value) => onChange({ workplace: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="workplaceScopeOfChange"
            value={conditions.workplaceScopeOfChange}
            onValueChange={(value) => onChange({ workplaceScopeOfChange: value })}
          />
        </div>
      </ProfileSection>

      <ProfileSection title={EMPLOYMENT_SECTION_LABELS.workingHours} icon={Clock}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            {...fieldProps}
            fieldKey="startTime"
            value={conditions.startTime}
            onValueChange={(value) => onChange({ startTime: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="endTime"
            value={conditions.endTime}
            onValueChange={(value) => onChange({ endTime: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="breakTime"
            value={conditions.breakTime}
            onValueChange={(value) => onChange({ breakTime: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="scheduledWorkingHours"
            value={conditions.scheduledWorkingHours}
            onValueChange={(value) => onChange({ scheduledWorkingHours: value })}
          />
          <YesNoField
            {...fieldProps}
            fieldKey="hasOvertime"
            value={conditions.hasOvertime}
            onValueChange={(value) => onChange({ hasOvertime: value })}
          />
          <YesNoField
            {...fieldProps}
            fieldKey="hasFixedOvertimePay"
            value={conditions.hasFixedOvertimePay}
            onValueChange={(value) => onChange({ hasFixedOvertimePay: value })}
          />
          {hasFixedOvertimePay && (
            <>
              <TextField
                {...fieldProps}
                fieldKey="fixedOvertimeHours"
                value={conditions.fixedOvertimePay.hours}
                onValueChange={(value) =>
                  onChange({ fixedOvertimePay: { ...conditions.fixedOvertimePay, hours: value } })
                }
              />
              <TextField
                {...fieldProps}
                fieldKey="fixedOvertimeAmount"
                value={conditions.fixedOvertimePay.amount}
                onValueChange={(value) =>
                  onChange({ fixedOvertimePay: { ...conditions.fixedOvertimePay, amount: value } })
                }
              />
              <div className="sm:col-span-2">
                <TextField
                  {...fieldProps}
                  fieldKey="fixedOvertimeExcessPayNote"
                  value={conditions.fixedOvertimePay.excessPayNote}
                  onValueChange={(value) =>
                    onChange({
                      fixedOvertimePay: { ...conditions.fixedOvertimePay, excessPayNote: value },
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
      </ProfileSection>

      <ProfileSection title={EMPLOYMENT_SECTION_LABELS.holidays} icon={CalendarDays}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            {...fieldProps}
            fieldKey="holidays"
            value={conditions.holidays}
            onValueChange={(value) => onChange({ holidays: value })}
            multiline
          />
          <TextField
            {...fieldProps}
            fieldKey="vacations"
            value={conditions.vacations}
            onValueChange={(value) => onChange({ vacations: value })}
            multiline
          />
          <TextField
            {...fieldProps}
            fieldKey="annualHolidaysCount"
            value={conditions.annualHolidaysCount}
            onValueChange={(value) => onChange({ annualHolidaysCount: value })}
          />
        </div>
      </ProfileSection>

      <ProfileSection title={EMPLOYMENT_SECTION_LABELS.wage} icon={Wallet}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            {...fieldProps}
            fieldKey="baseSalary"
            value={conditions.baseSalary}
            onValueChange={(value) => onChange({ baseSalary: value })}
          />
          <SelectField
            {...fieldProps}
            fieldKey="wageType"
            value={conditions.wageType}
            onValueChange={(value) => onChange({ wageType: value })}
            options={WAGE_TYPE_OPTIONS}
          />
          <TextField
            {...fieldProps}
            fieldKey="wageCalculationMethod"
            value={conditions.wageCalculationMethod}
            onValueChange={(value) => onChange({ wageCalculationMethod: value })}
            multiline
          />
          <TextField
            {...fieldProps}
            fieldKey="wagePaymentMethod"
            value={conditions.wagePaymentMethod}
            onValueChange={(value) => onChange({ wagePaymentMethod: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="wageClosingDate"
            value={conditions.wageClosingDate}
            onValueChange={(value) => onChange({ wageClosingDate: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="wagePaymentDate"
            value={conditions.wagePaymentDate}
            onValueChange={(value) => onChange({ wagePaymentDate: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="allowances"
            value={conditions.allowances}
            onValueChange={(value) => onChange({ allowances: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="salaryIncrease"
            value={conditions.salaryIncrease}
            onValueChange={(value) => onChange({ salaryIncrease: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="bonus"
            value={conditions.bonus}
            onValueChange={(value) => onChange({ bonus: value })}
          />
        </div>
      </ProfileSection>

      <ProfileSection title={EMPLOYMENT_SECTION_LABELS.resignation} icon={LogOut}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            {...fieldProps}
            fieldKey="resignationProcedure"
            value={conditions.resignationProcedure}
            onValueChange={(value) => onChange({ resignationProcedure: value })}
            multiline
          />
          <TextField
            {...fieldProps}
            fieldKey="dismissalGrounds"
            value={conditions.dismissalGrounds}
            onValueChange={(value) => onChange({ dismissalGrounds: value })}
            multiline
          />
        </div>
      </ProfileSection>

      <details className="group rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:content-none">
          <span className="inline-flex items-center gap-2">
            {EMPLOYMENT_SECTION_LABELS.other}
            <span className="text-xs font-normal text-muted-foreground group-open:hidden">
              （クリックして開く）
            </span>
          </span>
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          {EMPLOYMENT_OTHER_CONDITIONS_META.description}
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            {...fieldProps}
            fieldKey="retirementAllowance"
            value={conditions.retirementAllowance}
            onValueChange={(value) => onChange({ retirementAllowance: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="temporaryWages"
            value={conditions.temporaryWages}
            onValueChange={(value) => onChange({ temporaryWages: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="employeeBurden"
            value={conditions.employeeBurden}
            onValueChange={(value) => onChange({ employeeBurden: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="safetyAndHealth"
            value={conditions.safetyAndHealth}
            onValueChange={(value) => onChange({ safetyAndHealth: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="vocationalTraining"
            value={conditions.vocationalTraining}
            onValueChange={(value) => onChange({ vocationalTraining: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="disasterCompensation"
            value={conditions.disasterCompensation}
            onValueChange={(value) => onChange({ disasterCompensation: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="commendationAndSanctions"
            value={conditions.commendationAndSanctions}
            onValueChange={(value) => onChange({ commendationAndSanctions: value })}
          />
          <TextField
            {...fieldProps}
            fieldKey="leaveOfAbsence"
            value={conditions.leaveOfAbsence}
            onValueChange={(value) => onChange({ leaveOfAbsence: value })}
          />
        </div>
      </details>
    </div>
  );
}
