declare global {
  interface TokenDocument {
    elevation: number
  }

  namespace ClientSettings {
    interface Values {
      "psikick.psi.enabled": boolean,
      "psikick.flank.enabled": boolean,
      "psikick.flank.bonus": number
    }
  }
}

export interface Module {
  setup: () => void
}
