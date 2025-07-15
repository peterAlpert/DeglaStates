export interface GeneralViolation {
    id?: number;
    date: string;
    day: string;
    time: string;
    location: string;
    memberName: string;
    membership: string;
    relation: string;
    relationMembership: string;
    violationType: string;
    control: string;
    supervisor: string;
    action: string;
    violationKind: string;

    [key: string]: string | number | undefined; // ✅ السطر اللي يحل المشكلة
}
