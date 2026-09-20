import type { ComponentType } from 'react';
import type { IconBaseProps } from 'react-icons';
import {
    MdAcUnit,
    MdAir,
    MdAirlineSeatReclineExtra,
    MdAirlineSeatReclineNormal,
    MdBatteryChargingFull,
    MdBluetooth,
    MdCameraAlt,
    MdCarRepair,
    MdChildCare,
    MdDirectionsCar,
    MdElectricCar,
    MdEventSeat,
    MdEvStation,
    MdGpsFixed,
    MdHeadset,
    MdHeatPump,
    MdKey,
    MdLocalGasStation,
    MdLocalParking,
    MdLuggage,
    MdMap,
    MdMusicNote,
    MdNavigation,
    MdPets,
    MdSatelliteAlt,
    MdScreenShare,
    MdSecurity,
    MdSensors,
    MdSpeed,
    MdThermostat,
    MdTireRepair,
    MdTv,
    MdUsb,
    MdVerifiedUser,
    MdWbSunny,
    MdWifi,
} from 'react-icons/md';
import {
    LuBatteryCharging,
    LuBluetooth,
    LuCar,
    LuFuel,
    LuHeadphones,
    LuHouse,
    LuKey,
    LuLinkedin,
    LuMail,
    LuMapPin,
    LuMessageSquare,
    LuMonitor,
    LuNavigation2,
    LuPhone,
    LuPhoneCall,
    LuShield,
    LuSnowflake,
    LuSun,
    LuWifi,
    LuYoutube,
    LuZap,
} from 'react-icons/lu';
import {
    FaCarBattery,
    FaFacebook,
    FaInstagram,
    FaLinkedin,
    FaPinterest,
    FaShieldHalved,
    FaSnowflake,
    FaTiktok,
    FaWhatsapp,
    FaXTwitter,
    FaYoutube,
} from 'react-icons/fa6';
import { GiWindow } from 'react-icons/gi';

export interface FeatureIconEntry {
    name: string;
    label: string;
    Icon: ComponentType<IconBaseProps>;
}
const TintedWindowIcon = ({
    size = 20,
    color = 'currentColor',
}: IconBaseProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2}
    >
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" opacity="0.4" />
        <line x1="3" y1="14" x2="21" y2="14" opacity="0.2" />
    </svg>
);

export const FEATURE_ICONS: FeatureIconEntry[] = [
    /* Climate & Comfort */
    { name: 'MdAcUnit', label: 'Air Conditioning', Icon: MdAcUnit },
    { name: 'LuSnowflake', label: 'Cooling', Icon: LuSnowflake },
    { name: 'FaSnowflake', label: 'Cold / Frost', Icon: FaSnowflake },
    { name: 'MdHeatPump', label: 'Heating', Icon: MdHeatPump },
    { name: 'MdThermostat', label: 'Thermostat', Icon: MdThermostat },
    { name: 'MdAir', label: 'Ventilation', Icon: MdAir },
    { name: 'MdWbSunny', label: 'Sunroof', Icon: MdWbSunny },
    { name: 'LuSun', label: 'Panoramic Roof', Icon: LuSun },

    /* Connectivity */
    { name: 'MdBluetooth', label: 'Bluetooth', Icon: MdBluetooth },
    { name: 'LuBluetooth', label: 'Bluetooth (alt)', Icon: LuBluetooth },
    { name: 'MdWifi', label: 'WiFi / Hotspot', Icon: MdWifi },
    { name: 'LuWifi', label: 'WiFi (alt)', Icon: LuWifi },
    { name: 'MdUsb', label: 'USB Charging', Icon: MdUsb },
    { name: 'MdHeadset', label: 'Audio Jack', Icon: MdHeadset },
    { name: 'LuHeadphones', label: 'Headphones', Icon: LuHeadphones },
    { name: 'MdScreenShare', label: 'Screen Mirror', Icon: MdScreenShare },
    { name: 'MdTv', label: 'Rear Screen', Icon: MdTv },
    { name: 'LuMonitor', label: 'Display Screen', Icon: LuMonitor },

    /* Navigation */
    { name: 'MdGpsFixed', label: 'GPS', Icon: MdGpsFixed },
    { name: 'MdNavigation', label: 'Navigation', Icon: MdNavigation },
    { name: 'LuNavigation2', label: 'Navigation (alt)', Icon: LuNavigation2 },
    { name: 'MdMap', label: 'Map', Icon: MdMap },
    { name: 'MdSatelliteAlt', label: 'Satellite', Icon: MdSatelliteAlt },

    /* Safety */
    { name: 'MdSecurity', label: 'Security System', Icon: MdSecurity },
    { name: 'MdVerifiedUser', label: 'Safety Verified', Icon: MdVerifiedUser },
    { name: 'FaShieldHalved', label: 'Shield / Safety', Icon: FaShieldHalved },
    { name: 'LuShield', label: 'Shield (alt)', Icon: LuShield },
    { name: 'MdCameraAlt', label: 'Dash / Backup Cam', Icon: MdCameraAlt },
    { name: 'MdSensors', label: 'Parking Sensors', Icon: MdSensors },
    { name: 'MdSpeed', label: 'Cruise Control', Icon: MdSpeed },

    /* Power & Fuel */
    { name: 'MdElectricCar', label: 'Electric Vehicle', Icon: MdElectricCar },
    { name: 'LuZap', label: 'Electric / Hybrid', Icon: LuZap },
    { name: 'MdEvStation', label: 'EV Charging Station', Icon: MdEvStation },
    {
        name: 'MdBatteryChargingFull',
        label: 'Charging Port',
        Icon: MdBatteryChargingFull,
    },
    {
        name: 'LuBatteryCharging',
        label: 'Battery Charging',
        Icon: LuBatteryCharging,
    },
    { name: 'FaCarBattery', label: 'Car Battery', Icon: FaCarBattery },
    {
        name: 'MdLocalGasStation',
        label: 'Fuel / Petrol',
        Icon: MdLocalGasStation,
    },
    { name: 'LuFuel', label: 'Fuel Type', Icon: LuFuel },

    /* Entertainment */
    { name: 'MdMusicNote', label: 'Music System', Icon: MdMusicNote },

    /* Seating */
    { name: 'MdEventSeat', label: 'Seat', Icon: MdEventSeat },
    {
        name: 'MdAirlineSeatReclineNormal',
        label: 'Standard Seating',
        Icon: MdAirlineSeatReclineNormal,
    },
    {
        name: 'MdAirlineSeatReclineExtra',
        label: 'Reclining Seats',
        Icon: MdAirlineSeatReclineExtra,
    },

    /* Other */
    { name: 'MdKey', label: 'Keyless Entry', Icon: MdKey },
    { name: 'LuKey', label: 'Key (alt)', Icon: LuKey },
    { name: 'MdChildCare', label: 'Child Seat', Icon: MdChildCare },
    { name: 'MdPets', label: 'Pet Friendly', Icon: MdPets },
    { name: 'MdLuggage', label: 'Luggage Space', Icon: MdLuggage },
    { name: 'MdLocalParking', label: 'Parking', Icon: MdLocalParking },
    { name: 'MdDirectionsCar', label: 'Vehicle', Icon: MdDirectionsCar },
    { name: 'LuCar', label: 'Car (alt)', Icon: LuCar },
    { name: 'MdTireRepair', label: 'Spare Tyre', Icon: MdTireRepair },
    { name: 'MdCarRepair', label: 'Maintenance', Icon: MdCarRepair },
    { name: 'GiWindow', label: 'Window', Icon: GiWindow },
    { name: 'TintedWindow', label: 'Tinted Window', Icon: TintedWindowIcon },

    /* Contact */
    { name: 'LuPhone', label: 'Phone', Icon: LuPhone },
    { name: 'LuPhoneCall', label: 'Phone Call', Icon: LuPhoneCall },
    { name: 'LuMail', label: 'Mail / Email', Icon: LuMail },
    { name: 'LuHouse', label: 'Home / Address', Icon: LuHouse },
    { name: 'LuMapPin', label: 'Map Pin', Icon: LuMapPin },
    { name: 'LuMessageSquare', label: 'Message / Chat', Icon: LuMessageSquare },

    /* Social */
    { name: 'FaFacebook', label: 'Facebook', Icon: FaFacebook },
    { name: 'FaInstagram', label: 'Instagram', Icon: FaInstagram },
    { name: 'FaXTwitter', label: 'X / Twitter', Icon: FaXTwitter },
    { name: 'FaWhatsapp', label: 'WhatsApp', Icon: FaWhatsapp },
    { name: 'FaLinkedin', label: 'LinkedIn', Icon: FaLinkedin },
    { name: 'LuLinkedin', label: 'LinkedIn (alt)', Icon: LuLinkedin },
    { name: 'FaYoutube', label: 'YouTube', Icon: FaYoutube },
    { name: 'LuYoutube', label: 'YouTube (alt)', Icon: LuYoutube },
    { name: 'FaPinterest', label: 'Pinterest', Icon: FaPinterest },
    { name: 'FaTiktok', label: 'TikTok', Icon: FaTiktok },
];

/** Lookup map: icon name string → React component (for rendering saved values). */
export const FEATURE_ICON_MAP: Record<
    string,
    ComponentType<IconBaseProps>
> = Object.fromEntries(FEATURE_ICONS.map(({ name, Icon }) => [name, Icon]));
