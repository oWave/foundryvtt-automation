import Flank from "./modules/flank"
import Psi from "./modules/psi"

Hooks.once("setup", () => {
  Psi.setup()
  Flank.setup()
})
