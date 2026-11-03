import { createContext, useContext } from 'react'

/**
 * Frame global komposisi. <Sequence> menggeser useCurrentFrame() ke frame lokal;
 * seluruh timing di utils/timing.ts ditulis dalam frame global, jadi scene membaca dari sini.
 */
export const GlobalFrame = createContext(0)
export const useGlobalFrame = () => useContext(GlobalFrame)
