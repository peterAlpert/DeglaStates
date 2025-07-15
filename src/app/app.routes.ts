import { OffensiveWordsComponent } from './Components/OffensiveWords/offensive-words/offensive-words.component';
import { ShowHSEComponent } from './Components/HSE/show-hse/show-hse.component';
import { Routes } from '@angular/router';
import { PlaceViolationComponent } from './Components/PlaceViolation/place-violation/place-violation.component';
import { ShowPlaceVioComponent } from './Components/PlaceViolation/show-place-vio/show-place-vio.component';
import { MemberComplaintComponent } from './Components/MemberComplaint/member-complaint/member-complaint.component';
import { ShowMemberComplaintComponent } from './Components/MemberComplaint/show-member-complaint/show-member-complaint.component';
import { InjuryListComponent } from './Components/Injuries/injury-list/injury-list.component';
import { InjuryComponent } from './Components/Injuries/injury/injury.component';
import { AddFightComponent } from './Components/Fight/add-fight/add-fight.component';
import { ShowFightComponent } from './Components/Fight/show-fight/show-fight.component';

import { ShowMissingChildComponent } from './Components/MissingChild/show-missing-child/show-missing-child.component';
import { ShowGeneralViolationComponent } from './Components/GeneralViolation/show-general-violation/show-general-violation.component';
import { AddEmployeeViolationComponent } from './Components/EmployeeViolation/add-employee-violation/add-employee-violation.component';
import { ShowEmployeeViolationsComponent } from './Components/EmployeeViolation/show-employee-violations/show-employee-violations.component';

import { MissingChildComponent } from './Components/MissingChild/add-missing-child/add-missing-child.component';
import { GeneralViolationFormComponent } from './Components/GeneralViolation/add-general-violation/add-general-violation.component';
import { AddHSEComponent } from './Components/HSE/add-hse/add-hse.component';
import { AddLostItemComponent } from './Components/LostItems/add-lost-item/add-lost-item.component';
import { LostItemsListComponent } from './Components/LostItems/lost-items-list/lost-items-list.component';
import { AddFoodVioComponent } from './Components/FoodViolation/add-food-vio/add-food-vio.component';
import { ShowFoodVioComponent } from './Components/FoodViolation/show-food-vio/show-food-vio.component';
import { OffensiveWordsViewComponent } from './Components/OffensiveWords/offensive-words-view/offensive-words-view.component';
import { LoginComponent } from './Components/Auth/login/login.component';
import { AuthGuard } from './Guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'placeViolation', pathMatch: 'full' },

    { path: 'placeViolation', component: PlaceViolationComponent, canActivate: [AuthGuard] },
    { path: 'placeViolations', component: ShowPlaceVioComponent, canActivate: [AuthGuard] },
    { path: 'member-feedback', component: MemberComplaintComponent, canActivate: [AuthGuard] },
    { path: 'member-feedback-list', component: ShowMemberComplaintComponent, canActivate: [AuthGuard] },
    { path: 'injury', component: InjuryComponent, canActivate: [AuthGuard] },
    { path: 'injuries', component: InjuryListComponent, canActivate: [AuthGuard] },
    { path: 'addFight', component: AddFightComponent, canActivate: [AuthGuard] },
    { path: 'fights', component: ShowFightComponent, canActivate: [AuthGuard] },
    { path: 'missing-child', component: MissingChildComponent, canActivate: [AuthGuard] },
    { path: 'missing-child-list', component: ShowMissingChildComponent, canActivate: [AuthGuard] },
    { path: 'general-violation', component: GeneralViolationFormComponent, canActivate: [AuthGuard] },
    { path: 'general-violation-list', component: ShowGeneralViolationComponent, canActivate: [AuthGuard] },
    { path: 'food-violation', component: AddFoodVioComponent, canActivate: [AuthGuard] },
    { path: 'food-violation-list', component: ShowFoodVioComponent, canActivate: [AuthGuard] },
    { path: 'employee-violation', component: AddEmployeeViolationComponent, canActivate: [AuthGuard] },
    { path: 'employee-violation-list', component: ShowEmployeeViolationsComponent, canActivate: [AuthGuard] },
    { path: 'add-hse', component: AddHSEComponent, canActivate: [AuthGuard] },
    { path: 'show-hse', component: ShowHSEComponent, canActivate: [AuthGuard] },
    { path: 'add-lostItem', component: AddLostItemComponent, canActivate: [AuthGuard] },
    { path: 'show-lostItems', component: LostItemsListComponent, canActivate: [AuthGuard] },
    { path: 'add-oppWords', component: OffensiveWordsComponent, canActivate: [AuthGuard] },
    { path: 'show-oppWords', component: OffensiveWordsViewComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },

];
