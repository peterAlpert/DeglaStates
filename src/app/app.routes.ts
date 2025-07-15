import { Routes } from '@angular/router';
import { LoginComponent } from './Components/Auth/login/login.component';
import { AuthGuard } from './Guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'placeViolation', pathMatch: 'full' },

    { path: 'login', component: LoginComponent },

    {
        path: 'placeViolation',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/PlaceViolation/place-violation/place-violation.component').then(m => m.PlaceViolationComponent)
    },
    {
        path: 'placeViolations',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/PlaceViolation/show-place-vio/show-place-vio.component').then(m => m.ShowPlaceVioComponent)
    },
    {
        path: 'member-feedback',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/MemberComplaint/member-complaint/member-complaint.component').then(m => m.MemberComplaintComponent)
    },
    {
        path: 'member-feedback-list',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/MemberComplaint/show-member-complaint/show-member-complaint.component').then(m => m.ShowMemberComplaintComponent)
    },
    {
        path: 'injury',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/Injuries/injury/injury.component').then(m => m.InjuryComponent)
    },
    {
        path: 'injuries',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/Injuries/injury-list/injury-list.component').then(m => m.InjuryListComponent)
    },
    {
        path: 'addFight',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/Fight/add-fight/add-fight.component').then(m => m.AddFightComponent)
    },
    {
        path: 'fights',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/Fight/show-fight/show-fight.component').then(m => m.ShowFightComponent)
    },
    {
        path: 'missing-child',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/MissingChild/add-missing-child/add-missing-child.component').then(m => m.MissingChildComponent)
    },
    {
        path: 'missing-child-list',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/MissingChild/show-missing-child/show-missing-child.component').then(m => m.ShowMissingChildComponent)
    },
    {
        path: 'general-violation',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/GeneralViolation/add-general-violation/add-general-violation.component').then(m => m.GeneralViolationFormComponent)
    },
    {
        path: 'general-violation-list',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/GeneralViolation/show-general-violation/show-general-violation.component').then(m => m.ShowGeneralViolationComponent)
    },
    {
        path: 'food-violation',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/FoodViolation/add-food-vio/add-food-vio.component').then(m => m.AddFoodVioComponent)
    },
    {
        path: 'food-violation-list',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/FoodViolation/show-food-vio/show-food-vio.component').then(m => m.ShowFoodVioComponent)
    },
    {
        path: 'employee-violation',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/EmployeeViolation/add-employee-violation/add-employee-violation.component').then(m => m.AddEmployeeViolationComponent)
    },
    {
        path: 'employee-violation-list',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/EmployeeViolation/show-employee-violations/show-employee-violations.component').then(m => m.ShowEmployeeViolationsComponent)
    },
    {
        path: 'add-hse',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/HSE/add-hse/add-hse.component').then(m => m.AddHSEComponent)
    },
    {
        path: 'show-hse',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/HSE/show-hse/show-hse.component').then(m => m.ShowHSEComponent)
    },
    {
        path: 'add-lostItem',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/LostItems/add-lost-item/add-lost-item.component').then(m => m.AddLostItemComponent)
    },
    {
        path: 'show-lostItems',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/LostItems/lost-items-list/lost-items-list.component').then(m => m.LostItemsListComponent)
    },
    {
        path: 'add-oppWords',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/OffensiveWords/offensive-words/offensive-words.component').then(m => m.OffensiveWordsComponent)
    },
    {
        path: 'show-oppWords',
        canActivate: [AuthGuard],
        loadComponent: () => import('./Components/OffensiveWords/offensive-words-view/offensive-words-view.component').then(m => m.OffensiveWordsViewComponent)
    },
];
