// @ts-ignore
import { FirestoreSerializable, SiteModel } from "../libraries/Web-Legos/api/models.ts";

export class EducationItem extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("education-item", "Education Item")
  }
  booleans = {
  }
  images = {
  }
  numbers = {
    order: 0,
  }
  shortStrings = {
    title: "",
    subtitle: ""
  }
  longStrings = {
  }
  
  fillConstantExampleData() {
    this.shortStrings.title = "Boston University BA in Psychology";
    this.shortStrings.subtitle = "1993";
    return this;
  }

  static examples = () => { 
    
    const pa = (new EducationItem()).fillConstantExampleData().toFirestore();
    pa.title = "University of Pennsylvania MSW"
    pa.subtitle = "1997"

    return {
      bu: (new EducationItem()).fillConstantExampleData().toFirestore(),
      pa: pa,
    }
  }

  fromFirestore(data: any) : EducationItem {
    const e = new EducationItem();
    e.id = data.id;
    e.shortStrings.subtitle = data.subtitle
    e.shortStrings.title = data.title
    e.numbers.order = data.order;
    return e;
  }
}

export class MembershipItem extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("membership-item", "Membership Item")
  }
  booleans = {
  }
  images = {
  }
  numbers = {
    order: 0,
  }
  shortStrings = {
    title: "",
    subtitle: ""
  }
  longStrings = {
  }
  
  fillConstantExampleData() {
    this.shortStrings.title = "Pennsylvania Society of Clinical Social Workers";
    return this;
  }

  static examples = () => { 
    return {
      default: (new MembershipItem()).fillConstantExampleData().toFirestore(),
    }
  }

  fromFirestore(data: any) : MembershipItem {
    const e = new MembershipItem();
    e.id = data.id;
    e.shortStrings.subtitle = data.subtitle
    e.shortStrings.title = data.title
    e.numbers.order = data.order;
    return e;
  }
}

export class CertificationItem extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("certification-item", "Certification Item")
  }
  booleans = {
  }
  images = {
  }
  numbers = {
    order: 0,
  }
  shortStrings = {
    title: "",
    subtitle: ""
  }
  longStrings = {
  }
  
  fillConstantExampleData() {
    this.shortStrings.title = "Boston University BA in Psychology";
    this.shortStrings.subtitle = "1993";
    return this;
  }

  static examples = () => { 
    
    const pa = (new CertificationItem()).fillConstantExampleData().toFirestore();
    pa.title = "PA Licensed Clinical Social Worker"
    pa.subtitle = ""
    
    const gt = (new CertificationItem()).fillConstantExampleData().toFirestore();
    gt.title = "Certified Gestalt Therapist"
    gt.subtitle = ""
    
    const yoga = (new CertificationItem()).fillConstantExampleData().toFirestore();
    yoga.title = "Certified Yoga Teacher"
    yoga.subtitle = ""
    
    const pilates = (new CertificationItem()).fillConstantExampleData().toFirestore();
    pilates.title = "Certified Pilates Teacher"
    pilates.subtitle = ""
    
    const gm = (new CertificationItem()).fillConstantExampleData().toFirestore();
    gm.title = "Group Motion Facilitator"
    gm.subtitle = ""

    return {
      pa: pa,
      gt: gt,
      yoga: yoga,
      pilates: pilates,
      gm: gm,
    }
  }

  fromFirestore(data: any) : CertificationItem {
    const e = new CertificationItem();
    e.id = data.id;
    e.shortStrings.subtitle = data.subtitle
    e.shortStrings.title = data.title
    e.numbers.order = data.order;
    return e;
  }
}


export class TreatmentItem extends SiteModel implements FirestoreSerializable {
  constructor() {
    super("treatment-item", "Treatment Item")
  }
  booleans = {
  }
  images = {
  }
  numbers = {
    order: 0,
  }
  shortStrings = {
    title: "",
  }
  longStrings = {
  }
  
  fillConstantExampleData() {
    this.shortStrings.title = "Anxiety";
    return this;
  }

  static examples = () => { 
   
    const depression = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    depression.title = "Depression"
    const trauma = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    trauma.title = "Trauma (PTSD)"
    const grief = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    grief.title = "Grief"
    const relationships = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    relationships.title = "Relationship Issues"
    const stress = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    stress.title = "Stress Management"
    const chronic = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    chronic.title = "Chronic Illness/Pain"
    const work = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    work.title = "Work Issues"
    const transitions = (new TreatmentItem()).fillConstantExampleData().toFirestore();
    transitions.title = "Life Transitions — Parenting, Divorce, Aging"

    return {
      anxiety: (new TreatmentItem()).fillConstantExampleData().toFirestore(),
      depression: depression,
      trauma: trauma,
      grief: grief,
      relationships: relationships,
      stress: stress,
      chronic: chronic,
      work: work,
      transitions: transitions,
    }
  }

  fromFirestore(data: any) : TreatmentItem {
    const e = new TreatmentItem();
    e.id = data.id;
    e.shortStrings.title = data.title
    e.numbers.order = data.order;
    return e;
  }
}