// alias import — useFoo as useAliased
import { useFoo as useAliased } from './basic-import'

export function useAliasCaller() {
    const v = useAliased()
    return v
}
