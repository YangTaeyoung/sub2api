const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp']

export function handleChoiceGroupKeydown(event: KeyboardEvent): void {
  const group = event.currentTarget as HTMLElement | null
  if (!group) return
  const options = Array.from(
    group.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)')
  )
  const current = options.indexOf(document.activeElement as HTMLElement)
  if (current < 0 || options.length < 2) return

  let target = -1
  if (NEXT_KEYS.includes(event.key)) target = (current + 1) % options.length
  else if (PREV_KEYS.includes(event.key)) target = (current - 1 + options.length) % options.length
  else if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = options.length - 1
  if (target < 0) return

  event.preventDefault()
  options[target].focus()
  options[target].click()
}
