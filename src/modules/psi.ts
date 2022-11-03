import { MODULE_NAME } from "../constants"
import { Module } from "../types"

async function prompt(limit: number, remaining: number, max: number) {
  return await new Promise<number|null>((resolve, reject) => {
    new Dialog({
      title: "Psi",
      content: `
      <p>
        Psi Remaining:<br>
        Total: ${remaining}<br>
        This turn: ${limit}
      </p>
      <div>
        Psi Points: <input id="psi-input" type="number" value="1" min="1" max="${Math.min(
          limit,
          remaining,
          max
        )}" style="max-width: 5ch; margin-left: 8px" />
      </div>
      `,
      buttons: {
        ok: {
          label: "Use",
          callback: (html) => {
            const input = (html as JQuery).find("input#psi-input").val()
            resolve(Number(input))
          },
          icon: '<i class="fas fa-check"></i>',
        },
        skip: {
          label: "Skip",
          callback: () => {
            resolve(null)
          },
          icon: '<i class="fas fa-arrow-turn-down-right"></i>',
        },
        cancel: {
          label: "Cancel",
          callback: () => reject("Prompt canceled"),
          icon: '<i class="fas fa-x"></i>',
        },
      },
    }).render(true)
  })
}

const helper = {
  isPsion(actor: Actor) {
    return !!actor.classes.psion
  },

  psiLimitFromLevel(level: number) {
    if (level > 20 || level < 1) throw new RangeError("Bad level")

    if (level >= 9) return 7
    return [2, 2, 3, 3, 5, 5, 6, 6][level - 1]
  },

  psiUsed(actor: Actor) {
    // return (actor.getFlag(MODULE_NAME, "used") as number) || 0
    return actor.system.resources.secondary.value
  },

  psiLimit(actor: Actor) {
    const used = this.psiUsed(actor)
    return this.psiLimitFromLevel(actor.classes.psion.system.levels) - used
  },

  psiRemaining(actor: Actor) {
    return actor.system.resources.primary.value as number
  },

  consume(actor: Actor, amount: number) {
    console.log(`Attemping to consume ${amount} Psi on ${actor.name}`)
    const limit = this.psiLimit(actor)
    const remaining = this.psiRemaining(actor)
    if (amount > limit) {
      ui.notifications.error(`Only ${limit} Psi remaining this turn`)
      return false
    }
    if (remaining < amount) {
      ui.notifications.error(`Only ${remaining} Psi Points remaining`)
      return false
    }

    // actor.setFlag("psikick", "used", this.psiUsed(actor) + amount)
    actor.system.resources.secondary.value += amount
    actor.system.resources.primary.value -= amount
    this.whisper(
      `Spend ${amount} Psi Points. ${remaining - amount} left (${
        limit - amount
      } this turn)`
    )
    return true
  },

  startTurn(actor: Actor) {
    if (!this.isPsion(actor)) return
    const used = actor.system.resources.secondary.value
    if (!used) return
    this.whisper(
      `<b>Turn Start:</b> ${actor.name} Psi Used reset to 0 (was ${used})`
    )
    // actor.setFlag(MODULE_NAME, "used", 0)
    actor.system.resources.secondary.value = 0
  },

  async prompt(actor: Actor, min: number, max: number) {
    return prompt(this.psiLimit(actor), this.psiRemaining(actor), max)
  },

  async whisper(content: string, gms = false) {
    const list = game.user ? [game.user] : []
    if (gms) game.users?.filter((u) => u.isGM).forEach((e) => list.push(e))
    ChatMessage.create({
      content,
      whisper: list,
    })
  },
}

const module: Module = {
  setup() {
    window.psi = helper

    Hooks.on("updateCombat", (combat: Combat, _, data) => {
      if (!data.diff || data.direction !== 1) return
      if (combat.combatant?.actor) helper.startTurn(combat.combatant?.actor)
    })

    game.settings.register(MODULE_NAME, "psi.enabled", {
      name: "Psi Point Automation",
      hint: "Enables psi limit reset automation",
      config: true,
      default: true,
      type: Boolean,
    })
  },
}

export default module
