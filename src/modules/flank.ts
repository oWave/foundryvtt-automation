import { MODULE_NAME } from "../constants"

function attackRange(actor: Actor) {
  return Math.max(
    5,
    ...actor.items
      .filter((i) => i.system.actionType == "mwak" && i.system.equipped)
      .map((i) => {
        const defaultRange = i.system.properties?.rch ? 10 : 5
        if (i.system.properties?.thr) {
          return defaultRange
        }
        return i.system.range.value || defaultRange
      })
  )
}

function inAttackRange(token: Token, target: Token) {
  const scale = canvas.grid.grid.options.dimensions.distance / canvas.grid.size
  const dx = Math.abs(token.center.x - target.center.x) * scale
  const dy = Math.abs(token.center.y - target.center.y) * scale
  const dz = Math.abs(token.document.elevation - target.document.elevation)

  const reach = attackRange(token.actor)
  const range = reach + ((token.w + target.w) * scale) / 2

  return dx < range && dy < range && dz < range
}

function canFlank(actor: Actor) {
  return !actor.effects.some((e) =>
    [
      "Dead",
      "Incapacitated",
      "Petrified",
      "Paralysed",
      "Stunned",
      "Unconscious",
    ].includes(e.label)
  )
}

const { lineSegmentIntersects } = foundry.utils
const onOppositeSides = (
  flankerA: Token,
  flankerB: Token,
  target: Token
): boolean => {
  const [centerA, centerB] = [flankerA.center, flankerB.center]
  const bounds = target.bounds as PIXI.Rectangle

  const left = new Ray(
    { x: bounds.left, y: bounds.top },
    { x: bounds.left, y: bounds.bottom }
  )
  const right = new Ray(
    { x: bounds.right, y: bounds.top },
    { x: bounds.right, y: bounds.bottom }
  )
  const top = new Ray(
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.top }
  )
  const bottom = new Ray(
    { x: bounds.left, y: bounds.bottom },
    { x: bounds.right, y: bounds.bottom }
  )
  const intersectsSide = (side: Ray): boolean =>
    lineSegmentIntersects(centerA, centerB, side.A, side.B)

  return (
    (intersectsSide(left) && intersectsSide(right)) ||
    (intersectsSide(top) && intersectsSide(bottom))
  )
}

function isFlanking(attacker: Token, target: Token) {
  if (!attacker.actor || !canFlank(attacker.actor)) return false

  // All allies that can attack the target
  const candidates = canvas.tokens?.placeables.filter((t) => {
    if (t.id == attacker.id || t.id == target.id) return false
    return (
      !!t.actor &&
      t.document.disposition == attacker.document.disposition &&
      canFlank(t.actor) &&
      inAttackRange(t, target)
    )
  })

  if (!candidates || !candidates.length) return false

  console.log("Flank candidates:\n", candidates.map((t) => t.name).join("\n"))

  const ally = candidates.find((t) => onOppositeSides(attacker, t, target))
  if (ally) {
    console.log("✅ Flanking with", ally.name)
    return true
  } else {
    console.log("No valid flanking ally")
    return false
  }
}

function onAttack(item: Item, config) {
  if (game.user?.targets.size !== 1) return
  const target = [...game.user.targets][0]
  const attacker =
    item.actor?.token?.object ||
    item.actor?.getActiveTokens(true, true)?.at(0)?.object
  if (!attacker) return

  if (isFlanking(attacker as Token, target)) {
    config.parts.push(`${game.settings.get(MODULE_NAME, "flank.bonus")}[Flanking]`)
    config.messageData[`flags.${MODULE_NAME}.flanking`] = true
  }
}

function rsrRender(data) {
  const t = data.templates as string[]
  const index = t.findIndex(
    (html) => html.includes('data-type="attack"') && html.includes("[Flanking]")
  )
  if (index < 0) return
  data.templates.splice(
    index,
    0,
    '<div style="text-align: center; color: red">Flanking</div>'
  )

  /* const html = t[index]
  if (html.includes("[Flanking]")) {
    const cut = html.indexOf('<div class="rsr5e-roll-label">') + '<div class="rsr5e-roll-label">'.length
    t[index] = html.slice(0, cut) + '<div style="text-align: center; color: red">Flanking</div>' + html.slice(cut)
  } */
}

const module = {
  setup() {
    Hooks.on("dnd5e.preRollAttack", this.hook(onAttack))
    Hooks.on("rsr5e.render", this.hook(rsrRender))

    game.settings.register(MODULE_NAME, "flank.enabled", {
      name: "Flank Automation",
      hint: "Enables flanking automation",
      config: true,
      default: true,
      type: Boolean,
    })

    game.settings.register(MODULE_NAME, "flank.bonus", {
      name: "Flank Bonus",
      hint: "Melee attack roll bonus when flanking",
      config: true,
      default: 2,
      range: {
        min: 1,
        max: 10,
        step: 1,
      },
      type: Number,
    })
  },

  enabled() {
    return game.settings.get(MODULE_NAME, "flank.enabled")
  },

  hook(callback) {
    return (...args) => {
      if (this.enabled()) return callback(...args)
    }
  },
}

export default module
