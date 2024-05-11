import { createContext, ReactNode, useContext } from "react"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { useNavigate } from 'react-router-dom';
import actions from "../data/actions.json"

type UserContextProviderProps = {
    children: ReactNode
}

type MessagesHistory = {
    id: number
    text: string
}

type Actions = {
    id: number
    action: string
}

type User = {
    id: number
    name: string
}

type UserContext = {
    doAction?: (actionId: number, subactionId?: number) => void;
    completedActions: Actions[]
    messagesHistory: MessagesHistory[]
}

const UserContext = createContext({} as UserContext)

export function userContextAwareness() {
    return useContext(UserContext)
}

export function UserContextProvider({ children }: UserContextProviderProps) {
    const [userContext, setUserContext] = useLocalStorage<UserContext>(
        "user-Context", {
        completedActions: [],
        messagesHistory: []
    }
    )

    const navigate = useNavigate();

    function doAction(actionId: number, subactionId?: number) {
        // Busca la acción con el ID proporcionado en el array de acciones importado
        const action = actions.find((a) => a.id === actionId);

        if (action) {
            // Genera el href basado en la acción y subacción (si existen)
            let href = `/${action.action}`;

            if (subactionId && action.subactions) {
                // Busca la subacción por subactionId
                const subaction = action.subactions.find((sub) => sub.id === subactionId);
                if (subaction) {
                    href += `/${subaction.action}`;
                }
            }

            // Update completedActions
            const updatedCompletedActions = [...userContext?.completedActions, action];

            // Update userContext
            setUserContext((prevUserContext) => ({
                ...prevUserContext,
                completedActions: updatedCompletedActions,
            }));

            // Navega a la nueva ruta programáticamente
            navigate(href);
        }
    }

    return (
        <UserContext.Provider
            value={{
                doAction,
                completedActions: userContext?.completedActions || [],
                messagesHistory: userContext?.messagesHistory || [],
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

