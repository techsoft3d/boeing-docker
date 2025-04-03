import { Util } from "@hoops/web-viewer";
class StateMachine extends Util.StateMachine {
  constructor(controller) {
    super({ name: "not initialized", controller }, defaultReducer);
  }
}
function defaultReducer(state, { name, payload }) {
  const isUpdateDiscarded = (state2) => ["update triggered", "paused"].indexOf(state2.name) !== -1;
  switch (name) {
    case "init":
      if (state.name !== "not initialized") {
        console.info("Cutting planes module already initialized");
        break;
      }
      state.name = "updating";
      state.controller.init().then(() => {
        if (isUpdateDiscarded(state)) {
          defaultReducer(state, { name: "update", payload });
          return;
        }
        state.name = "outdated";
      });
      break;
    case "update":
      if (state.name === "not initialized") {
        defaultReducer(state, { name: "init", payload });
        break;
      }
      if (isUpdateDiscarded(state)) {
        break;
      } else if (state.name === "updating") {
        state.name = "update triggered";
        break;
      }
      Util.delayCall(async () => {
        state.name = "updating";
        await state.controller.update();
        if (state.name === "paused") {
          return;
        }
        if (isUpdateDiscarded(state)) {
          defaultReducer(state, { name: "update", payload });
          return;
        }
        state.name = "up to date";
      });
      break;
    case "refresh":
      if (state.name === "not initialized") {
        throw new Error("CuttingPlane.Controller.StateMachine has not been initialized");
      }
      if (state.name === "paused") {
        break;
      }
      Util.delayCall(async () => {
        state.name = "updating";
        await state.controller.refresh();
        if (isUpdateDiscarded(state)) {
          defaultReducer(state, { name: "update", payload });
          return;
        }
        state.name = "up to date";
      });
      break;
    case "clear":
      if (state.name === "not initialized") {
        throw new Error("CuttingPlane.Controller.StateMachine has not been initialized");
      }
      Util.delayCall(async () => {
        state.name = "updating";
        await state.controller.update();
        if (state.name === "paused") {
          return;
        }
        await state.controller.clear();
        if (isUpdateDiscarded(state)) {
          defaultReducer(state, { name: "update", payload });
          return;
        }
        state.name = "up to date";
      });
      break;
    case "pause":
      if (state.name === "not initialized") {
        break;
      }
      state.name = "paused";
      break;
    case "resume":
      if (state.name !== "paused") {
        break;
      }
      state.name = "up to date";
      break;
  }
  return state;
}
export {
  StateMachine,
  defaultReducer
};
