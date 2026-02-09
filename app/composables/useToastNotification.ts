export const useToastNotification = () => {
    const toast = useToast()

    const showToast = (props: {
        title: string
        description?: string
        type?: 'success' | 'error' | 'warning' | 'info'
        icon?: string
        duration?: number
    }) => {
        const colorMap = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        }

        const iconMap = {
            success: 'i-heroicons-check-circle',
            error: 'i-heroicons-x-circle',
            warning: 'i-heroicons-exclamation-triangle',
            info: 'i-heroicons-information-circle'
        }

        toast.add({
            title: props.title,
            description: props.description,
            color: colorMap[props.type || 'info'] as any,
            icon: props.icon || iconMap[props.type || 'info']
        })
    }

    // Shorthand methods
    const success = (title: string, description?: string) => {
        showToast({ title, description, type: 'success' })
    }

    const error = (title: string, description?: string) => {
        showToast({ title, description, type: 'error' })
    }

    const warning = (title: string, description?: string) => {
        showToast({ title, description, type: 'warning' })
    }

    const info = (title: string, description?: string) => {
        showToast({ title, description, type: 'info' })
    }

    return {
        showToast,
        success,
        error,
        warning,
        info
    }
}
