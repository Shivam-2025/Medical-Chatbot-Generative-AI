import re
from typing import Optional

def check_emergency(message: str) -> Optional[str]:
    """
    Checks if a user query represents a serious medical emergency.
    Returns a standard safety advice string if it's an emergency, otherwise None.
    """
    message_lower = message.lower()
    
    # 1. Direct emergency phrases indicating active emergency situations
    direct_phrases = [
        "head is bleeding", "head bleeding", "bleeding head", "bleeding from head",
        "having a heart attack", "having a cardiac arrest", "having a stroke", 
        "cannot breathe", "can't breathe", "choking on", "took poison",
        "bleeding heavily", "chest hurts", "call an ambulance", "call a doctor"
    ]
    
    # 2. Conditions and actions that together indicate an emergency
    emergency_conditions = [
        "bleed", "bleeding", "blood", "heart", "cardiac", "chest", "stroke", 
        "breath", "breathing", "choke", "choking", "poison", "poisoning", 
        "unconscious", "passed out", "seizure", "burn", "allergic"
    ]
    
    emergency_actions = [
        "what to do", "how to cure", "how to treat", "help", 
        "emergency", "urgent", "dying", "save", "first aid", 
        "immediately", "immeadiately", "right now", "cure", "treat"
    ]
    
    has_direct = any(phrase in message_lower for phrase in direct_phrases)
    has_condition = any(cond in message_lower for cond in emergency_conditions)
    has_action = any(act in message_lower for act in emergency_actions)
    
    if has_direct or (has_condition and has_action):
        # Educational check to prevent false positives for informational queries
        educational_phrases = [
            "what is", "define", "history of", "explain", "how does", "how do",
            "symptoms of", "causes of", "risk factors", "information about",
            "tell me about", "mechanism of"
        ]
        is_educational = any(message_lower.startswith(edu) or f" {edu} " in message_lower for edu in educational_phrases)
        
        # Override educational check if they explicitly ask what to do / how to cure / how to treat / help
        override_educational = any(act in message_lower for act in ["how to cure", "what to do", "how to treat", "help"])
        
        if not is_educational or override_educational:
            return (
                "🚨 **CRITICAL MEDICAL EMERGENCY ALERT** 🚨\n\n"
                "If you or someone nearby is experiencing a life-threatening medical emergency (such as a heart attack, severe bleeding, difficulty breathing, chest pain, or stroke), **please call an ambulance and consult a nearby doctor immediately.**\n\n"
                "Do not wait. Professional medical help is required right away."
            )
            
    return None
