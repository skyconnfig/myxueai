import type { StoryboardScene } from '../director-plan.js'
import {
  adaptStoryboardToVideoScenes,
  buildScenePropsFromDirectorScene,
  storyboardSceneToDirectorInput,
} from './director-to-composition.js'
import type { VideoScene } from '../video-scene.js'

export {
  adaptDirectorPlanToCompositionJSON,
  adaptStoryboardToVideoScenes,
  buildScenePropsFromDirectorScene,
  storyboardSceneToDirectorInput,
} from './director-to-composition.js'
export type { DirectorSceneInput } from './director-to-composition.js'

export function buildScenePropsFromStoryboard(scene: StoryboardScene): Record<string, unknown> | undefined {
  return buildScenePropsFromDirectorScene(storyboardSceneToDirectorInput(scene))
}

export function storyboardSceneToVideoScene(scene: StoryboardScene): VideoScene {
  return adaptStoryboardToVideoScenes([scene])[0]
}
