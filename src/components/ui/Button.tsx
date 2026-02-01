import React from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export const Button = ({
    label,
    onPress,
    variant = "primary",
    isLoading = false,
    disabled = false,
    className = "",
    icon,
}: ButtonProps) => {
    const baseStyles = "h-14 rounded-2xl flex-row items-center justify-center px-6 transition-all active:scale-95";
    const variantStyles = {
        primary: "bg-violet-600 shadow-lg shadow-violet-500/30",
        secondary: "bg-emerald-600 shadow-lg shadow-emerald-500/30",
        outline: "bg-transparent border-2 border-slate-700",
        ghost: "bg-transparent",
    };

    const textStyles = {
        primary: "text-white font-bold text-lg",
        secondary: "text-white font-bold text-lg",
        outline: "text-white font-bold text-lg",
        ghost: "text-slate-400 font-medium text-lg",
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
            className={`${baseStyles} ${variantStyles[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
        >
            {isLoading ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={textStyles[variant]}>{label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};
