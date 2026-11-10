"use strict";

const form = document.querySelector("#loan-form");
const amountInput = document.querySelector("#amount");
const rateInput = document.querySelector("#rate");
const currencyInput = document.querySelector("#currency");
const startMonthInput = document.querySelector("#start-month");
const endMonthInput = document.querySelector("#end-month");
const formError = document.querySelector("#form-error");

const output = {
  payment: document.querySelector("#monthly-payment"),
  paymentCurrency: document.querySelector("#payment-currency"),
  paymentTerm: document.querySelector("#payment-term"),
  interest: document.querySelector("#total-interest"),
  total: document.querySelector("#total-paid"),
  description: document.querySelector("#results-description"),
};
const amountCurrencySymbol = document.querySelector("#amount-currency-symbol");

const errorElements = {
  amount: document.querySelector("#amount-error"),
  rate: document.querySelector("#rate-error"),
  currency: document.querySelector("#currency-error"),
  startMonth: document.querySelector("#start-month-error"),
  endMonth: document.querySelector("#end-month-error"),
};

const fields = {
  amount: amountInput,
  rate: rateInput,
  currency: currencyInput,
  startMonth: startMonthInput,
  endMonth: endMonthInput,
};

function setFieldError(name, message) {
  fields[name].setAttribute("aria-invalid", "true");
  errorElements[name].textContent = message;
}

function clearFieldError(name) {
  fields[name].removeAttribute("aria-invalid");
  errorElements[name].textContent = "";
}

function clearErrors() {
  Object.keys(fields).forEach(clearFieldError);
  formError.textContent = "";
}

function parseMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  return year * 12 + month - 1;
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getValidatedValues() {
  let firstInvalidField = null;
  const markInvalid = (name, message) => {
    setFieldError(name, message);
    firstInvalidField ||= fields[name];
  };

  const amountText = amountInput.value.trim();
  const amount = Number(amountText);
  if (!amountText) {
    markInvalid("amount", "Ingresa el monto del préstamo.");
  } else if (!Number.isFinite(amount) || amount <= 0) {
    markInvalid("amount", "El monto debe ser un número mayor que cero.");
  }

  const rateText = rateInput.value.trim();
  const rate = Number(rateText);
  if (!rateText) {
    markInvalid("rate", "Ingresa la tasa anual.");
  } else if (!Number.isFinite(rate) || rate < 0) {
    markInvalid("rate", "La tasa debe ser un número igual o mayor que cero.");
  }

  if (!currencyInput.value) {
    markInvalid("currency", "Selecciona una moneda.");
  }

  const startMonth = parseMonth(startMonthInput.value);
  if (startMonth === null) {
    markInvalid("startMonth", "Selecciona el mes de inicio.");
  }

  const endMonth = parseMonth(endMonthInput.value);
  if (endMonth === null) {
    markInvalid("endMonth", "Selecciona el mes de la última cuota.");
  } else if (startMonth !== null && endMonth < startMonth) {
    markInvalid("endMonth", "El mes de última cuota no puede ser anterior al inicio.");
  }

  if (firstInvalidField) {
    firstInvalidField.focus();
    return null;
  }

  const months = endMonth - startMonth + 1;
  const interest = amount * (rate / 100) * (months / 12);
  const total = amount + interest;
  const payment = total / months;

  if (![interest, total, payment].every(Number.isFinite)) {
    formError.textContent = "No fue posible calcular con estos valores. Revisa el monto y la tasa.";
    amountInput.focus();
    return null;
  }

  return { amount, months, interest, total, payment, currency: currencyInput.value };
}

function renderResults(result) {
  output.payment.textContent = formatCurrency(result.payment, result.currency);
  output.paymentCurrency.textContent = result.currency;
  output.interest.textContent = formatCurrency(result.interest, result.currency);
  output.total.textContent = formatCurrency(result.total, result.currency);
  output.paymentTerm.textContent = `${result.months} ${result.months === 1 ? "cuota" : "cuotas"} estimadas`;
  output.description.textContent = `Estimación para un préstamo de ${formatCurrency(result.amount, result.currency)}.`;
}

function resetResults() {
  output.payment.textContent = "—";
  output.paymentCurrency.textContent = "";
  output.interest.textContent = "—";
  output.total.textContent = "—";
  output.paymentTerm.textContent = "El resultado aparecerá aquí";
  output.description.textContent = "Completa los datos para ver el detalle estimado de pagos.";
}

function updateCurrencySymbol() {
  const currencyPart = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyInput.value,
  }).formatToParts(0).find((part) => part.type === "currency");
  amountCurrencySymbol.textContent = currencyPart ? currencyPart.value : "";
}

Object.entries(fields).forEach(([name, field]) => {
  const handleChange = () => {
    clearFieldError(name);
    resetResults();
  };
  field.addEventListener("input", handleChange);
  field.addEventListener("change", handleChange);
});

currencyInput.addEventListener("change", updateCurrencySymbol);
updateCurrencySymbol();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();
  const result = getValidatedValues();
  if (result) {
    renderResults(result);
  } else {
    resetResults();
  }
});
