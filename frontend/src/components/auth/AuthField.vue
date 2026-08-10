<script setup lang="ts">
defineProps<{
  label: string
  type?: string
  modelValue: string
  placeholder?: string
  required?: boolean
  minlength?: number | string
  autocomplete?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="auth-field">
    <span class="auth-field__label">{{ label }}</span>
    <input
      class="auth-field__input"
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :minlength="minlength"
      :autocomplete="autocomplete"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<style scoped>
.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.auth-field__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.auth-field__input {
  width: 100%;
  height: 2.75rem;
  padding: 0 0.875rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.auth-field__input::placeholder {
  color: #6b7280;
}

.auth-field__input:hover {
  border-color: #3b4354;
}

.auth-field__input:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  background: rgba(11, 13, 16, 0.9);
}
</style>
