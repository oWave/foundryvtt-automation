declare global {
  interface TokenDocument {
    elevation: number
  }

  namespace ClientSettings {
    interface Values {
      'drop-effects.show-effects-on-item-roll': boolean;
    }
  }
}

export {}
