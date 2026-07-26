export const iconFills = {
  orange: "#f05c21",
  red: "#f0214e",
  blue: "#009bdf",
  green: "#00ae17",
}

/** Default size for BeyondTheBell icons */
const defaultIconSize = "1.875rem";

function BTBIcon(props) {
  return (
    <svg style={{marginRight: props.marginRight}} xmlns="http://www.w3.org/2000/svg" height={props.size ? `${props.size}` : defaultIconSize} viewBox="0 -960 960 960" width={props.size ? `${props.size}` : defaultIconSize} fill={props.fill}>
      {props.children}
    </svg>
  )
}

export function SchoolDaysIcon({fill, size, marginRight}) {
  return (
    <BTBIcon fill={fill} size={size} marginRight={marginRight}>
      <path d="M479-120 189-279v-240L40-600l439-240 441 240v317h-60v-282l-91 46v240L479-120Zm0-308 315-172-315-169-313 169 313 172Zm0 240 230-127v-168L479-360 249-485v170l230 127Zm1-240Zm-1 74Zm0 0Z"/>
    </BTBIcon>
  )
}

export function AfterSchoolIcon({fill, size, marginRight}) {
  return (
    <BTBIcon fill={fill} size={size} marginRight={marginRight}>
      <path d="m627-287 45-45-159-160v-201h-60v225l174 181ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-82 31.5-155t86-127.5Q252-817 325-848.5T480-880q82 0 155 31.5t127.5 86Q817-708 848.5-635T880-480q0 82-31.5 155t-86 127.5Q708-143 635-111.5T480-80Zm0-400Zm0 340q140 0 240-100t100-240q0-140-100-240T480-820q-140 0-240 100T140-480q0 140 100 240t240 100Z"/>
    </BTBIcon>
  )
}

export function ContractIcon({fill, size, marginRight}) {
  return (
    <BTBIcon fill={fill} size={size} marginRight={marginRight}>
      <path d="M180-120q-24.75 0-42.375-17.625T120-180v-600q0-24.75 17.625-42.375T180-840h205q5-35 32-57.5t63-22.5q36 0 63 22.5t32 57.5h205q24.75 0 42.375 17.625T840-780v600q0 24.75-17.625 42.375T780-120H180Zm0-60h600v-600H180v600Zm100-100h273v-60H280v60Zm0-170h400v-60H280v60Zm0-170h400v-60H280v60Zm200-177q14 0 24.5-10.5T515-832q0-14-10.5-24.5T480-867q-14 0-24.5 10.5T445-832q0 14 10.5 24.5T480-797ZM180-180v-600 600Z"/>
    </BTBIcon>
  );
};

export function ScholarshipIcon({fill, size, marginRight}) {
  return (
    <BTBIcon fill={fill} size={size} marginRight={marginRight}>
      <path d="M321-160q-24 0-42-18t-18-42v-100h124v-127q-38 3-76-10.5T241-500v-58h-50L60-689q36-34 86-55.5T248-766q30 0 68.5 9.5T385-726v-74h455v535q0 44-30.5 74.5T735-160H321Zm124-160h245v55q0 20 12.5 32.5T735-220q20 0 32.5-12.5T780-265v-475H445v57l241 241v43h-43L517-525l-17 20q-13 15-26 23t-29 15v147ZM218-618h83v89q17 11 33.5 16.5T368-507q25 0 51-13.5t38-27.5l17-20-69-69q-32-32-72-50.5T248-706q-27 0-49 6.5T154-682l64 64Zm412 358H321v40h323q-6-6-10-16.5t-4-23.5Zm-309 40v-40 40Z"/>
    </BTBIcon>
  )
}

export function BookIcon({fill, size, marginRight}) {
  return (
    <BTBIcon fill={fill} size={size} marginRight={marginRight}>
      <path d="M480-160q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740v506q51-33 107-49.5T700-300q36 0 78.5 7t81.5 29v-505q9.886 3.75 19.443 7.875Q889-757 898-752q10 6 16 15.677 6 9.678 6 20.323v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm60-167v-353l260-260v387L540-327Zm-120 63v-439q-34-19-79-28t-81-9q-47 0-87.5 10T100-704.467V-264q35-17 75.5-26.5t85-9.5q44.5 0 84.5 9.5t75 26.5Zm0 0v-439 439Z"/>
    </BTBIcon>
  )
}

export function PencilIcon({fill, size, marginRight}) {
  return (
    <BTBIcon fill={fill} size={size} marginRight={marginRight}>
      <path d="M180-180h44l443-443-44-44-443 443v44Zm614-486L666-794l42-42q17-17 42-17t42 17l44 44q17 17 17 42t-17 42l-42 42Zm-42 42L248-120H120v-128l504-504 128 128Zm-107-21-22-22 44 44-22-22Z"/>
    </BTBIcon>
  )
}