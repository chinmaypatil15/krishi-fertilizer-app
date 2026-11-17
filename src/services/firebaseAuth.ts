import { firebaseConfig } from '../config/firebase';
import { pickText } from '../i18n/translations';
import { Language } from '../types';

export interface SendOtpResult {
  success: boolean;
  verificationId?: string;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  uid?: string;
  idToken?: string;
  isNewUser?: boolean;
  error?: string;
}

/**
 * Send real SMS OTP using Google Firebase Phone Authentication
 * Localizes all warnings according to active language (en, hi, mr).
 */
export async function sendFirebaseOtp(
  rawPhone: string,
  lang: Language = 'mr'
): Promise<SendOtpResult> {
  const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
  const e164Phone = `+91${digitsOnly}`;

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${firebaseConfig.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: e164Phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const rawError = data?.error?.message || '';
      let errMsg = rawError;

      if (rawError.includes('BILLING_NOT_ENABLED')) {
        errMsg = pickText(
          lang,
          'Firebase SMS requires Blaze plan OR add your phone number under "Phone numbers for testing" in Firebase Console.',
          'Firebase SMS के लिए Blaze प्लान आवश्यक है या Firebase Console में "Phone numbers for testing" में अपना नंबर जोड़ें।',
          'Firebase SMS साठी Blaze प्लॅन आवश्यक आहे किंवा Firebase Console मध्ये "Phone numbers for testing" मध्ये आपला नंबर जोडा.'
        );
      } else if (
        rawError.includes('region enabled') ||
        rawError.includes('SMS unable to be sent until this region enabled')
      ) {
        errMsg = pickText(
          lang,
          'Firebase blocked SMS: Go to Firebase Console -> Authentication -> Settings -> "SMS Region Policy" and add "India (+91)".',
          'Firebase ने SMS ब्लॉक किया: कृपया Firebase Console -> Authentication -> Settings -> "SMS Region Policy" में जाकर "India (+91)" जोड़ें।',
          'Firebase ने SMS ब्लॉक केला: कृपया Firebase Console -> Authentication -> Settings -> "SMS Region Policy" मध्ये जाऊन "India (+91)" जोडा.'
        );
      } else if (
        rawError.includes('CONFIGURATION_NOT_FOUND') ||
        rawError.includes('OPERATION_NOT_ALLOWED') ||
        rawError.includes('PHONE_AUTH_DISABLED')
      ) {
        errMsg = pickText(
          lang,
          'Please enable "Phone" in Firebase Console -> Authentication -> Sign-in method.',
          'कृपया Firebase Console -> Authentication -> Sign-in method में "Phone" चालू (Enable) करें।',
          'कृपया Firebase Console मध्ये जाऊन "Authentication" -> "Sign-in method" -> "Phone" Enable (सक्षम) करा.'
        );
      } else if (rawError.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        errMsg = pickText(
          lang,
          'Too many attempts. Please try again after some time.',
          'बहुत अधिक प्रयास किए गए। कृपया कुछ समय बाद पुनः प्रयास करें।',
          'खूप जास्त प्रयत्न झाले आहेत. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.'
        );
      } else {
        errMsg = pickText(
          lang,
          `Firebase SMS Error: ${rawError || 'Could not send SMS'}`,
          `Firebase SMS त्रुटि: ${rawError || 'एसएमएस नहीं भेजा जा सका'}`,
          `Firebase SMS त्रुटी: ${rawError || 'SMS पाठवता आला नाही'}`
        );
      }

      return {
        success: false,
        error: errMsg,
      };
    }

    return {
      success: true,
      verificationId: data.sessionInfo,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        pickText(
          lang,
          'Could not connect to Google Firebase Identity Toolkit.',
          'Google Firebase Identity Toolkit से संपर्क नहीं हो सका।',
          'Google Firebase Identity Toolkit शी संपर्क होऊ शकला नाही.'
        ),
    };
  }
}

/**
 * Verify real OTP against Google Firebase
 * Localizes all warnings according to active language (en, hi, mr).
 */
export async function verifyFirebaseOtp(
  verificationId: string,
  otpCode: string,
  _phoneNumber: string,
  lang: Language = 'mr'
): Promise<VerifyOtpResult> {
  const cleanCode = otpCode.trim();

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${firebaseConfig.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionInfo: verificationId,
        code: cleanCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const rawError = data?.error?.message || '';
      let errMsg = pickText(
        lang,
        'Invalid or expired OTP! Please check the 6-digit code received via SMS.',
        'अमान्य या समाप्त (Expired) ओटीपी! कृपया एसएमएस में प्राप्त 6 अंकों का कोड जाँचें।',
        'अवैध किंवा कालबाह्य OTP! कृपया SMS मध्ये आलेला ६-अंकी कोड तपासा.'
      );

      if (rawError.includes('INVALID_CODE')) {
        errMsg = pickText(
          lang,
          'Incorrect OTP! Please check the 6-digit code received via SMS.',
          'गलत ओटीपी! कृपया एसएमएस में प्राप्त 6 अंकों का कोड जाँचें।',
          'चुकीचा OTP! कृपया SMS मध्ये आलेला ६-अंकी कोड तपासा.'
        );
      } else if (rawError.includes('SESSION_EXPIRED')) {
        errMsg = pickText(
          lang,
          'This OTP has expired. Please tap "Resend OTP".',
          'यह ओटीपी समाप्त (Expired) हो गया है। कृपया "ओटीपी पुनः भेजें" दबाएँ।',
          'हा OTP कालबाह्य झाला आहे. कृपया "ओटीपी पुन्हा पाठवा" दाबा.'
        );
      }

      return {
        success: false,
        error: errMsg,
      };
    }

    return {
      success: true,
      uid: data.localId,
      idToken: data.idToken,
      isNewUser: data.isNewUser ?? false,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        pickText(
          lang,
          'Error verifying OTP with Google Firebase.',
          'Google Firebase के साथ ओटीपी सत्यापन में त्रुटि हुई।',
          'Google Firebase कडून OTP पडताळणी करताना त्रुटी आली.'
        ),
    };
  }
}
